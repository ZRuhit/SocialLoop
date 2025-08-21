// app/story/_layout.tsx
import { Stack } from "expo-router";

export default function StoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="create" />
      <Stack.Screen name="[userId]" />
    </Stack>
  );
}