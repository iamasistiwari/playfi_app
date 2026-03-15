from django.urls import path
from . import views

urlpatterns = [
    path("search/songs/", views.searchSongs, name="searchSongs"),
    path('playlists/', views.UserPlaylistsView.as_view()),
    path('playlists/global/', views.globalPlaylists),
    path('playlist/global', views.makePlaylistGlobal),
    path('playlist/private', views.makePlaylistPrivate),
    path('playlist/<uuid:pk>', views.UserSinglePlaylistsView.as_view()),
    path("add/song", views.addSongsToPlaylist, name="addSongsToPlaylist"),
    path("add/user", views.addUserToPlaylist, name="addUserToPlaylist"),
    path("remove/song", views.removeSongFromPlaylist, name="removeSongFromPlaylist"),
    path("playsong/", views.playSong, name="playSong"),
    path("update/songTitle", views.updateSongTitle, name="updateSongTitle"),
    path("check/is/admin", views.checkIsAdmin, name="checkIsAdmin"),
    path("makeadmin", views.makeUserAdmin, name="updateUser"),
    path("permanent/song/add/from/url", views.addPermanentSongUrl, name="addPermanentSongUrl"),
    path("permanent/song/add/from/site", views.addPermanentSongFromSiteUrl, name="addPermanentSongFromSiteUrl"),
    path("permanent/song/add/from/sitewithquery", views.addPermanentSongFromSiteUrlWithQuery, name="addPermanentSongFromSiteUrlWithQuery"),
    path("details/video", views.fetchVideoDetails, name="fetchVideoDetails"),

    # New endpoints
    path("user/profile", views.userProfile, name="userProfile"),
    path("song/play", views.recordPlay, name="recordPlay"),
    path("song/history", views.playHistory, name="playHistory"),
    path("user/stats", views.userStats, name="userStats"),
    path("trending", views.trending, name="trending"),
    path("recently-played", views.recentlyPlayed, name="recentlyPlayed"),
    path("recommendations", views.recommendations, name="recommendations"),
    path("search/suggestions", views.searchSuggestions, name="searchSuggestions"),
    path("playlist/invite", views.inviteToPlaylist, name="inviteToPlaylist"),
    path("playlist/leave", views.leavePlaylist, name="leavePlaylist"),
    path("playlist/remove/user", views.removeUserFromPlaylist, name="removeUserFromPlaylist"),
    path("users/search", views.searchUsers, name="searchUsers"),
    path("playlists/global/search", views.searchGlobalPlaylists, name="searchGlobalPlaylists"),
]
