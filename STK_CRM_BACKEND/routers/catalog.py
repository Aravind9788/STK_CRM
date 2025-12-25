from fastapi import APIRouter

router = APIRouter(
    prefix="/catalog",
    tags=["Catalog"]
)

@router.get("")
def get_catalog():
    """
    Read-only catalog for sales team.
    Used for product showcase during sales.
    """
    return [
        {
            "category": "False Ceiling",
            "products": [
                {
                    "name": "Gyproc MR Board",
                    "image_url": "https://s3.aws.../gyproc-mr.jpg",
                    "description": "Moisture resistant board, ideal for Kerala climate.",
                    "price": 100
                },
                {
                    "name": "Armstrong Grid Tile",
                    "image_url": "https://s3.aws.../armstrong-tile.jpg",
                    "description": "Premium grid tile system.",
                    "price": 150
                }
            ]
        },
        {
            "category": "Drywall Partition",
            "products": [
                {
                    "name": "Gyproc Standard Board",
                    "image_url": "https://s3.aws.../gyproc-standard.jpg",
                    "description": "Standard gypsum board for partitions.",
                    "price": 90
                }
            ]
        }
    ]
