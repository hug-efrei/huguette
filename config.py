from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    prowlarr_url: str = "http://192.168.1.203:9696"
    prowlarr_api_key: str = ""
    qbit_url: str = "http://192.168.1.202:8080"
    qbit_username: str = "admin"
    qbit_password: str = "adminadmin"
    calibre_watchfolder: str = "/downloads/calibre"

    model_config = {"env_file": ".env"}


settings = Settings()
