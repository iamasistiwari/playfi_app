import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import CustomInput from "@/components/sub/CustomInput";
import useFetch from "@/hooks/useFetch";
import { searchSongs } from "@/actions/songs";
import { Video } from "@/types/song";
import { cn } from "@/lib/utils";
import { CustomButton } from "@/components/sub/CustomButton";
import { post } from "@/lib/api";

interface ApiResponse {
  responseStatus: {
    status: boolean;
    message: string;
  };
  responseData: {
    query: string;
    site_url: string;
    song_url: string;
    song_title: string;
    video_id: string;
    image_url: string;
  };
}

const map = new Map([
  ["withQuery", "/api/v1/permanent/song/add/from/sitewithquery"],
  ["withSiteurl", "/api/v1/permanent/song/add/from/site"],
  ["withSongUrl", "/api/v1/permanent/song/add/from/url"],
]);

const dev = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMode, setCurrentMode] = useState<
    "withSongUrl" | "withSiteurl" | "withQuery"
  >("withQuery");
  const { data, loading, error, resetData, refetch } = useFetch<Video[]>(() =>
    searchSongs(searchQuery.trim())
  );
  const {
    data: apiData,
    loading: apiLoading,
    error: apiError,
    refetch: apiRefetch,
    resetData: apiDataReset,
  } = useFetch<ApiResponse>(
    async () => await post(map.get(currentMode), formData)
  );
  const inputRef = useRef<TextInput>(null);
  const [formData, setFormData] = useState({
    query: "",
    site_url: "",
    video_id: "",
    song_url: "",
    update: false,
  });

  const handleSubmit = async () => {
    apiDataReset();
    await apiRefetch();
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      const query = searchQuery.trim();
      if (query.length > 0) {
        inputRef.current?.blur();
        refetch();
      } else {
        resetData();
      }
    }, 700);
    return () => clearTimeout(timerId);
  }, [searchQuery]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#121212" }} // Replace Tailwind's `bg-primary`
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <CustomInput
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
          placeholder="enter song to search"
          className="text-white min-w-[300px]"
        />
        <View className="flex flex-row items-center justify-center gap-2 my-2">
          <CustomButton
            title="update"
            onPress={() => {
              setFormData({ ...formData, update: !formData.update });
            }}
            className="w-50"
          />
          <CustomButton
            title="reset data"
            onPress={() => {
              resetData();
              apiDataReset();
            }}
            className="bg-red-500 w-50"
          />
          <CustomButton
            title="change mode"
            onPress={() => {
              if (currentMode === "withQuery") {
                setCurrentMode("withSiteurl");
              } else if (currentMode === "withSiteurl") {
                setCurrentMode("withSongUrl");
              } else {
                setCurrentMode("withQuery");
              }
            }}
            className="w-50"
          />
        </View>
      </View>

      {loading && <Text className="text-white">loading...</Text>}
      {error && <Text className="text-white">error</Text>}

      {data && (
        <View className="gap-y-2">
          {data.map((item) => (
            <View
              key={item.id}
              className="flex flex-row items-start gap-x-2 mb-2"
            >
              <Image
                source={{ uri: item?.richThumbnail?.url }}
                className={cn("w-[60px] h-[60px] rounded-lg")}
                resizeMode="cover"
              />
              <View style={styles.infoContainer}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  {item.title}
                </Text>
                <Text style={styles.channel}>{item.channel.name}</Text>
              </View>
              <Text selectable className="text-white font-semibold">
                {item.id}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className="gap-y-2 mt-4">
        <View className="flex flex-row justify-between">
          <Text className=" text-2xl font-semibold text-white">
            update: {formData.update ? "yes" : "no"}
          </Text>
          <Text className="text-white text-2xl font-semibold">
            mode: {currentMode}
          </Text>
        </View>

        {currentMode === "withQuery" && (
          <CustomInput
            value={formData.query}
            onChangeText={(text) => setFormData({ ...formData, query: text })}
            placeholder="query"
            className="text-white min-w-[300px]"
          />
        )}

        {currentMode !== "withQuery" && (
          <CustomInput
            value={formData.video_id}
            onChangeText={(text) =>
              setFormData({ ...formData, video_id: text.trim() })
            }
            placeholder="video id"
            className="text-white min-w-[300px]"
          />
        )}
        {currentMode !== "withSongUrl" && (
          <CustomInput
            value={formData.site_url}
            onChangeText={(text) =>
              setFormData({ ...formData, site_url: text.trim() })
            }
            placeholder="site url"
            className="text-white min-w-[300px]"
          />
        )}
        {currentMode === "withSongUrl" && (
          <CustomInput
            value={formData.song_url}
            onChangeText={(text) =>
              setFormData({ ...formData, song_url: text.trim() })
            }
            placeholder="song url"
            className="text-white min-w-[300px]"
          />
        )}
        <CustomButton
          title="submit"
          loading={apiLoading}
          onPress={handleSubmit}
          className=" w-50"
        />
      </View>

      {apiError && (
        <Text className="text-red-500">Api Form error: {apiError}</Text>
      )}

      {apiData && (
        <View>
          <Text
            className={cn("font-semibold", {
              "text-green-500": apiData.responseStatus.status,
              "text-red-500": !apiData.responseStatus.status,
            })}
          >
            Api data Status: {apiData.responseStatus.status ? "True" : "False"}
          </Text>
          <Text numberOfLines={1} className="text-white">
            Api data message: {apiData.responseStatus.message}
          </Text>

          <InfoText label="query" value={apiData.responseData.query} />
          <InfoText label="site url" value={apiData.responseData.site_url} />
          <InfoText label="song url" value={apiData.responseData.song_url} />
          <InfoText
            label="song title"
            value={apiData.responseData.song_title}
          />
          <InfoText label="video id" value={apiData.responseData.video_id} />
          <View className="flex flex-row items-center justify-center">
            {apiData?.responseData?.image_url && (
              <Image
                source={{ uri: apiData.responseData.image_url }}
                className="w-[100px] h-[100px] rounded-lg"
                resizeMode="cover"
              />
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default dev;

const styles = StyleSheet.create({
  infoContainer: {
    flex: 1,
  },
  channel: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 2,
  },
  songId: {
    color: "#ccc",
    fontSize: 12,
    marginTop: 4,
    fontFamily: "monospace",
    backgroundColor: "#1e1e1e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
});

function InfoText({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex flex-row justify-between gap-4 m-2">
      <Text className="text-white font-semibold">{label}</Text>
      <Text selectable numberOfLines={1} className="text-white text-sm">
        {value}
      </Text>
    </View>
  );
}
