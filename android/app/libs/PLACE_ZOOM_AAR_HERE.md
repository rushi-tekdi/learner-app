# Drop Zoom SDK AAR files here

## Step-by-step download

1. Go to: https://marketplace.zoom.us
2. Sign in → click **My Apps** (top-right menu)
3. Open your **Meeting SDK** app
4. Click the **Download** tab (or look for "SDK Downloads" in the left sidebar)
5. Download **"Meeting SDK for Android"** (ZIP file, ~100-200 MB)

## What to extract

Unzip the downloaded file. Inside you will find one or more `.aar` files, for example:

```
mobilertc.aar          ← main Zoom SDK
commonlib.aar          ← optional companion library (include if present)
```

Copy **all `.aar` files** into this `android/app/libs/` folder.

## After dropping the files

Run the build again:
```
npm run android:prod
```

The `build.gradle` is already configured with:
```gradle
implementation fileTree(dir: 'libs', include: ['*.aar', '*.jar'])
```
so it will pick up the files automatically.

## Important

Do NOT commit the `.aar` files to git — add `*.aar` to `.gitignore`.
