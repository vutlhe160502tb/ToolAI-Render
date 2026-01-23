#!/usr/bin/env python3
"""
Test Webhook Script - Development/CI Tool

This script simulates a webhook call from third-party payment observer.
It calls the test-webhook endpoint which internally uses PaymentService.process_webhook().

Usage:
    python scripts/test_webhook.py <transaction_id>
    
Example:
    python scripts/test_webhook.py TXN-1769082827-5434

Note:
    - This is a helper script for development/testing
    - All business logic goes through PaymentService.process_webhook()
    - Not for production use
"""

import requests
import sys
import os
from datetime import datetime

def test_webhook(transaction_id: str, backend_url: str = "http://localhost:8000"):
    """
    Test webhook by calling the test-webhook endpoint.
    
    This endpoint internally calls PaymentService.simulate_webhook_success()
    which uses PaymentService.process_webhook() - the CORE LOGIC.
    """
    print(f"🧪 Testing webhook for transaction: {transaction_id}")
    print(f"   Backend URL: {backend_url}")
    print()
    
    # First, check payment status to show current state
    status_url = f"{backend_url}/api/payments/{transaction_id}/status"
    try:
        response = requests.get(status_url, timeout=5)
        if response.status_code == 200:
            payment_data = response.json()
            print(f"📋 Current Payment Status:")
            print(f"   Status: {payment_data.get('status')}")
            print(f"   Amount: {payment_data.get('amount')} VND")
            print(f"   Credits: {payment_data.get('credits')} coins")
            print()
        else:
            print(f"⚠️  Could not fetch payment status: {response.status_code}")
            print()
    except Exception as e:
        print(f"⚠️  Could not fetch payment status: {e}")
        print()
    
    # Call test-webhook endpoint
    webhook_url = f"{backend_url}/api/payments/test-webhook"
    try:
        print(f"🔄 Sending test webhook...")
        response = requests.post(
            webhook_url,
            json={"transaction_id": transaction_id},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Webhook processed successfully!")
            print(f"   Status: {result.get('status')}")
            if 'credits_added' in result:
                print(f"   Credits added: {result.get('credits_added')} coins")
            print()
            
            # Show updated status
            status_response = requests.get(status_url, timeout=5)
            if status_response.status_code == 200:
                updated_data = status_response.json()
                print(f"📋 Updated Payment Status:")
                print(f"   Status: {updated_data.get('status')}")
                print(f"   Credits: {updated_data.get('credits')} coins")
            
            return True
        elif response.status_code == 403:
            print(f"❌ Error: Test webhook is disabled in production environment")
            print(f"   Make sure ENV != 'production' in backend")
            return False
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            print(f"❌ Webhook failed: {response.status_code}")
            print(f"   Error: {error_data.get('detail', response.text)}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Error: Could not connect to backend at {backend_url}")
        print(f"   Make sure backend is running")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_webhook.py <transaction_id>")
        print()
        print("Example:")
        print("  python scripts/test_webhook.py TXN-1769082827-5434")
        print()
        print("Note:")
        print("  - This script calls the test-webhook endpoint")
        print("  - All business logic goes through PaymentService.process_webhook()")
        print("  - Only works in development environment")
        sys.exit(1)
    
    transaction_id = sys.argv[1]
    
    # Allow custom backend URL via environment variable
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    success = test_webhook(transaction_id, backend_url)
    sys.exit(0 if success else 1)

