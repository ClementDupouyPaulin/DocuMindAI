from app.core.security import get_password_hash, verify_password


def test_password_hash_is_not_plain_password() -> None:
    password = "password123"
    hashed_password = get_password_hash(password)

    assert hashed_password != password
    assert hashed_password.startswith("$2b$")


def test_verify_password_returns_true_for_valid_password() -> None:
    password = "password123"
    hashed_password = get_password_hash(password)

    assert verify_password(password, hashed_password) is True


def test_verify_password_returns_false_for_invalid_password() -> None:
    hashed_password = get_password_hash("password123")

    assert verify_password("wrong-password", hashed_password) is False