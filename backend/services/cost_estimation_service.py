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
        "upscale-image": 1.0,
        "google-banana-pro": 1.0,
        "product-model": 1.0,
        "change-outfit": 1.0,
        "skin-edit": 1.0,
        "face-swap": 1.0,
        "character-swap": 1.0,
        "character-swap-2": 1.0,
        "edit-video": 1.0,
        "product-intro-audio": 1.0,
    }
    
    @staticmethod
    def estimate_cost(feature_type: str, quality: str = "720P") -> float:
        """
        Estimate cost based on feature type and quality.
        Quality multiplier: 720P = 1x, 1080P = 2x
        """
        base_cost = CostEstimationService.COST_MAP.get(feature_type, 1.0)
        
        # Quality multiplier
        if quality and quality.upper() == "1080P":
            return base_cost * 2.0
        else:
            # Default to 720P (1x)
            return base_cost

