# Andy - The Vigilant Android Image File Watcher

Have you ever had to rename all your image files from appIcon@(1x|2x|3x).png to drawable-mdpi/app_icon.png, drawable-hdpi/app_icon.png, drawable-xhdpi/app_icon.png, etc... ?
It's a pain!

Meet Andy.

He watches your export directory and moves your multiple image size files to your drawables directory, creating all the necessary directories along the way, and renaming each file based on it's dpi category. 

## INSTALL

npm install -g andy-vigilante

## USAGE

```
andyvigilante /export/all/android/image/sizes/to/this/directory /Users/you/AndroidProject/app/src/main/res/
```

### What does this do?
This command will

1. watch your export directory for files approximately matching `[a-z0-9_]+(xxxhdpi|xxhdpi|xhdpi|hdpi|mdpi|ldpi|@1x|@1.5x|@2x|@3x).png`
1. recursively create new android drawable directories corresponding to the file's dpi type
1. move the new exported image file to it's appropriate drawable directory