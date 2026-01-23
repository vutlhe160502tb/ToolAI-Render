class CostEstimationService:
    COST_MAP = {
        # Existing
        "dance-image-bg": 10.0,
        "dance-video-bg": 10.0,
        "replace-ad": 15.0,
        "replace-ad-2": 15.0,
        "replace-fashion": 15.0,
        "lip-sync": 12.0,
        "sing": 12.0,
        # New features
        "create-image": 20.0,
        "create-video": 25.0,
        "upscale-image": 8.0,
        "google-banana-pro": 20.0,
        "product-model": 18.0,
        "change-outfit": 15.0,
        "skin-edit": 12.0,
        "face-swap": 15.0,
        "character-swap": 15.0,
        "character-swap-2": 15.0,
        "edit-video": 20.0,
        "product-intro-audio": 18.0,
    }
    
    @staticmethod
    def estimate_cost(feature_type: str) -> float:
        return CostEstimationService.COST_MAP.get(feature_type, 10.0)

