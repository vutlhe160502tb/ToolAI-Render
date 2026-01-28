class CostEstimationService:
    COST_MAP = {
        # Existing
        "dance-image-bg": 1.0,  # Base cost in coins
        "dance-video-bg": 1.0,
        "replace-ad": 1.0,
        "replace-ad-2": 1.0,
        "replace-fashion": 1.0,
        "lip-sync": 1.0,
        "sing": 1.0,
        # New features
        "create-image": 1.0,
        "create-video": 1.0,
        "upscale-image": 0.5,  # 2K = 0.5, 4K (1080P) = 0.8 (handled by quality multiplier)
        "google-banana-pro": 1.0,
        "product-model": 0.5,
        "change-outfit": 0.5,
        "skin-edit": 0.8,
        "face-swap": 0.5,
        "character-swap": 0.5,
        "character-swap-2": 1.0,
        "edit-video": 1.0,
        "product-intro-audio": 1.0,
    }
    
    @staticmethod
    def estimate_cost(feature_type: str, quality: str = "720P") -> float:
        """
        Estimate cost based on feature type and quality.
        Features without quality selector: fixed cost (product-model, face-swap, character-swap, change-outfit, skin-edit)
        Features with quality selector: upscale-image (2K=0.5, 4K=0.8)
        """
        base_cost = CostEstimationService.COST_MAP.get(feature_type, 1.0)
        
        # Special handling for upscale-image (has quality selector)
        if feature_type == "upscale-image":
            if quality and quality.upper() == "1080P":
                return 0.8  # 4K = 0.8 coin
            else:
                return 0.5  # 2K (720P) = 0.5 coin
        
        # Fixed cost features (no quality selector) - return base_cost regardless of quality
        fixed_cost_features = ["product-model", "face-swap", "character-swap", "change-outfit", "skin-edit"]
        if feature_type in fixed_cost_features:
            return base_cost  # Always return base cost, ignore quality parameter
        
        # Quality multiplier for other features (that have quality selector)
        if quality and quality.upper() == "1080P":
            return base_cost * 2.0
        else:
            # Default to 720P (1x)
            return base_cost

