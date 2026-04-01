import { ExpoConfig, ConfigContext } from 'expo/config';

const appName = process.env.COZE_PROJECT_NAME || process.env.EXPO_PUBLIC_COZE_PROJECT_NAME || '应用';
const projectId = process.env.COZE_PROJECT_ID || process.env.EXPO_PUBLIC_COZE_PROJECT_ID;
const slugAppName = projectId ? `app${projectId}` : 'myapp';

/**
 * 将字符串转换为符合 Android 包名规则的格式
 * - 只保留字母、数字和下划线
 * - 确保以字母开头
 */
function toValidPackageSegment(str: string): string {
  // 移除所有非字母数字和下划线的字符
  let cleaned = str.replace(/[^a-zA-Z0-9_]/g, '');
  
  // 确保以字母开头，如果不是则添加前缀
  if (cleaned.length === 0 || !/^[a-zA-Z]/.test(cleaned)) {
    cleaned = 'p' + cleaned;
  }
  
  return cleaned;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  // 生成有效的包名后缀
  const packageSuffix = projectId ? toValidPackageSegment(projectId) : 'app';
  
  return {
    ...config,
    "name": appName,
    "slug": slugAppName,
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    // OTA 热更新配置
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/" + (projectId || "default"),
      "fallbackToCacheTimeout": 0
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": `com.iotmonitor.${packageSuffix}`
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": `com.iotmonitor.${packageSuffix}`
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
        "expo-router",
        {
          "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
        }
      ] : 'expo-router',
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": `允许IoT监测控制App访问您的相册，以便您上传或保存图片。`,
          "cameraPermission": `允许IoT监测控制App使用您的相机，以便您直接拍摄照片上传。`,
          "microphonePermission": `允许IoT监测控制App访问您的麦克风，以便您拍摄带有声音的视频。`
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": `IoT监测控制App需要访问您的位置以提供周边服务及导航功能。`
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": `IoT监测控制App需要访问相机以拍摄照片和视频。`,
          "microphonePermission": `IoT监测控制App需要访问麦克风以录制视频声音。`,
          "recordAudioAndroid": true
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "eas": {
        "projectId": projectId
      }
    }
  }
}
