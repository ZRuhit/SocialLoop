import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useState } from "react";
import { styles } from "@/styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { COLORS } from "@/constants/theme";
//import { styles as createStyles } from "@/styles/create.style";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useMutation } from "convex/react";
import { HttpMethod } from "svix/dist/request";
import * as FileSystem from "expo-file-system";
import { api } from "@/convex/_generated/api";
export default function CreateScreen () {

  const router = useRouter();
  const { user } = useUser();
  const [caption, setCaption] = useState("");
  const [selectImage, setSelectImage] = useState<string | null >(null);
  const [isSharing, setIsSharing] = useState(false);

  const pickImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectImage(result.assets[0].uri);
      }
    }; 

    const generateUploadUrl = useMutation(api.post.generateUploadUrl);
    const createPost = useMutation(api.post.createPost);

    const handleShare = async () => {
    if (!selectImage) return;

    setIsSharing(true);
    try {
      // Add logic to handle sharing the post (e.g., uploading the image and caption)
      const uploadUrl=await generateUploadUrl();
     const uploadResult = await FileSystem.uploadAsync(uploadUrl, selectImage, {
      httpMethod: "POST", 
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      mimeType: "image/jpeg",
    });

      if(uploadResult.status !== 200) throw new Error("Failed to upload image");
      const {storageId} = JSON.parse(uploadResult.body);
      await createPost({StorageId: storageId, caption });

      router.push("/(tabs)");
      //console.log("Sharing post with image:", selectImage, "and caption:", caption);
    } catch (error) {
      console.error("Error sharing post:", error);
    } finally {
      setIsSharing(false);
    }
  };

      //console.log("Selected Image URI:", selectImage);


  if(!selectImage){
    return(
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=> router.back()}>
          <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <View style={{width:28}}/>
        </View>

        <TouchableOpacity style={styles.emptyImageContainer}  onPress={pickImage}>
          <Ionicons name="image-outline" size={48} color={COLORS.grey} />
          <Text style={styles.emptyImageText}>Tap to select an image</Text>
        </TouchableOpacity>  
    </View>
  );
}

return(
  <KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  style={styles.container}
  keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
>
  <View style={styles.contentContainer}>
    {/* Header */}
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => {
          setSelectImage(null);
          setCaption("");
        }}
        disabled={isSharing}
      >
        <Ionicons
          name="close-outline"
          size={28}
          color={isSharing ? COLORS.grey : COLORS.white}
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>New Post</Text>
      <TouchableOpacity
        style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
        disabled={isSharing || !selectImage}
        onPress={handleShare}
      >
        {isSharing ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Text style={styles.shareText}>Share</Text>
        )}
      </TouchableOpacity>
    </View>

    {/* Content */}
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      bounces={false}
      keyboardShouldPersistTaps="handled"
      contentOffset={{ x: 0, y: 100 }}
    >
      <View style={[styles.content, isSharing && styles.contentDisabled]}>
        {/* IMAGE SECTION */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: selectImage }} // Fixed source prop
            style={styles.previewImage}
            contentFit="cover"
            transition={200}
          />

          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={pickImage}
            disabled={isSharing}
          >
            <Ionicons name="image-outline" size={20} color={COLORS.white} />
            <Text style={styles.changeImageText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* INPUT */}
        <View style={styles.inputSection}>
          <View style={styles.captionContainer}>
            <Image
              source={{ uri: user?.imageUrl }} // Fixed source prop
              style={styles.userAvatar}
              contentFit="cover"
              transition={200}
            />
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor={COLORS.grey}
              multiline
              value={caption}
              onChangeText={setCaption}
              editable={!isSharing}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  </View>
</KeyboardAvoidingView>
)
};
