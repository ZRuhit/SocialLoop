// app/story/create.tsx
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";

import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/createStory.styles";

export default function CreateStoryScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const createStory = useMutation(api.stories.createStory);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16], // Story aspect ratio
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera permissions to continue.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16], // Story aspect ratio
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleCreateStory = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setIsUploading(true);

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload the image
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      const { storageId } = await uploadResponse.json();

      // Create the story
      await createStory({
        imageUrl: selectedImage,
        storageId,
      });

      // Simply go back without showing success message
      router.back();
    } catch (error) {
      console.error("Error creating story:", error);
      Alert.alert("Error", "Failed to create story. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      "Select Image",
      "Choose how you want to add an image",
      [
        { text: "Camera", onPress: takePhoto },
        { text: "Photo Library", onPress: pickImage },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Story</Text>
        <TouchableOpacity
          onPress={handleCreateStory}
          disabled={!selectedImage || isUploading}
          style={[
            styles.shareButton,
            (!selectedImage || isUploading) && styles.shareButtonDisabled,
          ]}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.shareButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.storyImage} />
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={showImagePicker}
            >
              <Ionicons name="camera" size={20} color={COLORS.white} />
              <Text style={styles.changeImageText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={showImagePicker}
            >
              <Ionicons name="camera" size={48} color={COLORS.primary} />
              <Text style={styles.addImageText}>Add Photo</Text>
              <Text style={styles.addImageSubtext}>
                Select a photo to share with your story
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}