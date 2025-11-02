from app.schemas.auth import LoginRequest, UserLoginResponse
from app.schemas.user import User, UserCreate, UserUpdate
from app.services.users import UsersService
from app.db.broker import get_dbbroker


def list_users() -> list[User]:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = UsersService(session)
        return svc.list()


def get_user(user_id: int) -> User | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = UsersService(session)
        return svc.get(user_id)


def create_user(data: UserCreate) -> User:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = UsersService(session)
        return svc.create(data)


def update_user(user_id: int, data: UserUpdate) -> User | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = UsersService(session)
        return svc.update(user_id, data)


def delete_user(user_id: int) -> bool:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = UsersService(session)
        return svc.delete(user_id)


def login_user(data: LoginRequest) -> UserLoginResponse | None:
    broker = get_dbbroker()
    with broker.session() as session:
        svc = UsersService(session)
        result = svc.authenticate(data.email, data.password)
        if not result:
            return None

        # support services that return either (user, token) or just user
        if isinstance(result, tuple) and len(result) == 2:
            user, token = result
        else:
            user = result
            # fallback token generation if service doesn't supply one
            token = f"user-token-{getattr(user, 'id', 'unknown')}"

        return UserLoginResponse(access_token=token, user=user)
