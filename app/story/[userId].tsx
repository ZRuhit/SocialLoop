// app/story/[userId].tsx
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";

import { Loader } from "@/components/Loader";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/storyViewer.styles";

const { width, height } = Dimensions.get("window");

export default function StoryViewerScreen() {
  const { userId } = useLocalSearchParams();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stories = useQuery(
    api.stories.getUserStories,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );
  const markAsViewed = useMutation(api.stories.markStoryAsViewed);

  const currentStory = stories?.[currentStoryIndex];

  // Auto-progress timer
  useEffect(() => {
    if (!currentStory || isPaused) return;

    progressAnim.setValue(0);
    
    const duration = 5000; // 5 seconds per story
    
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });

    // Mark story as viewed
    if (!currentStory.hasViewed) {
      markAsViewed({ storyId: currentStory._id });
    }

    return () => {
      animation.stop();
    };
  }, [currentStoryIndex, isPaused, stories]);

  const nextStory = () => {
    if (!stories) return;
    
    // Stop current animation
    progressAnim.stopAnimation();
    
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      router.back();
    }
  };

  const previousStory = () => {
    // Stop current animation
    progressAnim.stopAnimation();
    
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      router.back();
    }
  };

  const handlePress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const screenWidth = width;
    
    if (locationX < screenWidth / 2) {
      // Left side tap - go to previous story
      previousStory();
    } else {
      // Right side tap - go to next story (skip current one)
      nextStory();
    }
  };

  const handleLongPress = () => {
    setIsPaused(true);
    progressAnim.stopAnimation();
  };

  const handlePressOut = () => {
    if (isPaused) {
      setIsPaused(false);
    }
  };

  if (!stories || stories.length === 0) {
    return <Loader />;
  }

  if (!currentStory) {
    router.back();
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Progress bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBar}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width:
                    index < currentStoryIndex
                      ? "100%"
                      : index === currentStoryIndex
                      ? "0%"
                      : "0%",
                },
              ]}
            />
            {index === currentStoryIndex && (
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Story image */}
      <View style={styles.storyContainer}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          style={styles.touchableArea}
        >
          <Image
            source={{ uri: currentStory.imageUrl }}
            style={styles.storyImage}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.storyInfo}>
          <Text style={styles.storyTime}>
            {formatDistanceToNow(new Date(currentStory._creationTime), {
              addSuffix: true,
            })}
          </Text>
        </View>
      </View>

      {/* Navigation arrows */}
      <View style={styles.navigationArrows}>
        {/* Previous story button */}
        {(currentStoryIndex > 0 || stories.length > 1) && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.leftArrow]}
            onPress={() => {
              console.log('Left arrow pressed');
              previousStory();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}
        
        {/* Next story button */}
        {currentStoryIndex < stories.length - 1 && (
          <TouchableOpacity
            style={[styles.arrowButton, styles.rightArrow]}
            onPress={() => {
              console.log('Right arrow pressed');
              nextStory();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Navigation hints (optional - you can keep or remove) */}
      <View style={styles.navigationHints}>
        <View style={styles.navigationHint} />
        <View style={styles.navigationHint} />
      </View>
    </View>
  );
}