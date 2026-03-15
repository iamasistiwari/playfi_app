from django.contrib import admin
from .models import User, Songs, Playlists, PlayHistory, PlaylistMembership

admin.site.register(User)
admin.site.register(Songs)
admin.site.register(Playlists)
admin.site.register(PlayHistory)
admin.site.register(PlaylistMembership)
