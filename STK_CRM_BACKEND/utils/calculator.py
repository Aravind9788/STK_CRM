def calculate_material(area_sqft: int):
    return {
        "ceiling_section": area_sqft * 0.06,
        "main_tee": area_sqft * 0.08
    }
