from django.urls import path, include
from . import views

urlpatterns = [
    path("search/songs/", views.searchSongs, name="seachSongs"),
    path('playlists/', views.UserPlaylistsView.as_view()),                 
    path('playlists/global/', views.globalPlaylists),  
    path('playlist/global', views.makePlaylistGlobal),  
    path('playlist/<uuid:pk>/', views.UserSinglePlaylistsView.as_view()), 
    path("add/song", views.addSongsToPlaylist, name="addSongsToPlaylist"),
    path("add/user", views.addUserToPlaylist, name="addUserToPlaylist"),
    path("remove/song", views.removeSongFromPlaylist, name="removeSongFromPlaylist"),
    path("playsong/", views.playSong, name="playSong"),
    path("update/songTitle", views.updateSongTitle, name="updateSongTitle"),
    path("check/is/admin", views.checkIsAdmin, name="checkIsAdmin"),
    path("makeadmin", views.makeUserAdmin, name="updateUser"),
    path("permanent/song/", views.addPermanentSongUrl, name="addPermanentSongUrl")
]
