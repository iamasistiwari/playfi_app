from django.urls import path, include
from . import views

urlpatterns = [
    path("search/songs/", views.searchSongs, name="seachSongs"),
    path('playlists/', views.UserPlaylistsView.as_view()),                 
    path('playlist/<uuid:pk>/', views.UserSinglePlaylistsView.as_view()),       
    path("add/song", views.addSongsToPlaylist, name="addSongsToPlaylist"),
    path("add/user", views.addUserToPlaylist, name="addUserToPlaylist"),
    path("playsong/", views.playSong, name="playSong"),
    path("recentSongs/", views.recentSongs, name="recentSongs"),
]
