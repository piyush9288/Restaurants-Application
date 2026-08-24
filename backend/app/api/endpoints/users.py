from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.profiles import CustomerProfile
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ProfileUpdate(BaseModel):
    name: str
    phone: str
    address: str
    
class ProfileResponse(BaseModel):
    email: str
    name: Optional[str]
    phone: Optional[str]
    address: Optional[str]

@router.get("/me/profile", response_model=ProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.CUSTOMER:
        profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
        return {
            "email": current_user.email,
            "name": profile.name if profile else "",
            "phone": profile.phone if profile else "",
            "address": profile.address if profile else ""
        }
    else:
        # Just return email for non-customers for now
        return {"email": current_user.email, "name": "", "phone": "", "address": ""}

@router.put("/me/profile")
def update_profile(profile_data: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=400, detail="Only customers can update profile here")
        
    profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    if profile:
        profile.name = profile_data.name
        profile.phone = profile_data.phone
        profile.address = profile_data.address
    else:
        profile = CustomerProfile(user_id=current_user.id, name=profile_data.name, phone=profile_data.phone, address=profile_data.address)
        db.add(profile)
        
    db.commit()
    return {"message": "Profile updated successfully"}
