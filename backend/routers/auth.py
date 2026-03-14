"""Auth router for user registration, login, and logout."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.engine import get_db
from database.models import User, UserRole
from schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthResponse,
    UserResponse,
)
from auth import (
    hash_password,
    authenticate_user,
    create_session,
    delete_session,
    get_current_user,
    get_user_by_username,
    get_user_by_email,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user (customer or admin)."""
    # Validate role
    if user_data.role not in ["customer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'customer' or 'admin'.",
        )

    # Check if username already exists
    existing_user = await get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered.",
        )

    # Check if email already exists
    existing_email = await get_user_by_email(db, user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )

    # Create new user
    user_role = UserRole.ADMIN if user_data.role == "admin" else UserRole.CUSTOMER
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        role=user_role,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return AuthResponse(
        user=UserResponse(**new_user.to_dict()),
        message=f"User registered successfully as {user_data.role}.",
    )


@router.post("/login", response_model=dict)
async def login_user(
    login_data: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login a user and create a session."""
    user = await authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    # Create session
    session_token = create_session(user.username, user.id)

    return {
        "user": UserResponse(**user.to_dict()),
        "session_token": session_token,
        "message": "Login successful.",
    }


@router.post("/logout")
async def logout_user(
    current_user: User = Depends(get_current_user),
):
    """Logout the current user and destroy session."""
    session_token = f"session_{current_user.username}"
    delete_session(session_token)

    return {"message": "Logout successful."}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get current authenticated user information."""
    return UserResponse(**current_user.to_dict())
