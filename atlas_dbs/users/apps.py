from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = 'users'
    
    # to use signals
    def ready(self):
        import users.signals
