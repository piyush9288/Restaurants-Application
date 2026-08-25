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
    pincode: Optional[str] = None
    
class ProfileResponse(BaseModel):
    email: str
    name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    pincode: Optional[str]
    role: str

@router.get("/me/profile", response_model=ProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == UserRole.CUSTOMER:
        profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
        return {
            "email": current_user.email,
            "name": profile.name if profile else "",
            "phone": profile.phone if profile else "",
            "address": profile.address if profile else "",
            "pincode": profile.pincode if profile else "",
            "role": current_user.role.value
        }
    else:
        # Just return email for non-customers for now
        return {"email": current_user.email, "name": "", "phone": "", "address": "", "pincode": "", "role": current_user.role.value}

@router.put("/me/profile")
def update_profile(profile_data: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=400, detail="Only customers can update profile here")
        
    profile = db.query(CustomerProfile).filter(CustomerProfile.user_id == current_user.id).first()
    if profile:
        profile.name = profile_data.name
        profile.phone = profile_data.phone
        profile.address = profile_data.address
        profile.pincode = profile_data.pincode
    else:
        profile = CustomerProfile(user_id=current_user.id, name=profile_data.name, phone=profile_data.phone, address=profile_data.address, pincode=profile_data.pincode)
        db.add(profile)
        
    db.commit()
    return {"message": "Profile updated successfully"}

from app.models.profiles import DeliveryPartnerProfile

class DeliveryWithdrawRequest(BaseModel):
    amount: float
    upi_id: str

@router.get("/delivery/me")
def get_delivery_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.DELIVERY_PARTNER:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    profile = db.query(DeliveryPartnerProfile).filter(DeliveryPartnerProfile.user_id == current_user.id).first()
    if not profile:
        profile = DeliveryPartnerProfile(user_id=current_user.id, name=f"Rider {current_user.id}")
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    return profile

@router.post("/delivery/withdraw")
def withdraw_delivery_earnings(request: DeliveryWithdrawRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != UserRole.DELIVERY_PARTNER:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    profile = db.query(DeliveryPartnerProfile).filter(DeliveryPartnerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    profile.upi_id = request.upi_id
        
    available = profile.total_earnings - profile.withdrawn_amount
    if request.amount > available or request.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid withdrawal amount")
        
    profile.withdrawn_amount += request.amount
    db.commit()
    return {"message": "Withdrawal successful", "withdrawn_amount": profile.withdrawn_amount}

