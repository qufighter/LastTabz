#!/bin/sh
# This script builds the project as a chrome zip upload
# it should only be run from the directory that it is in

PROG="LastTabz"
mani="manifest.json"
mfj=`ls manifest.json`

if [ "$mfj" != "$mani" ]; then
   echo "manifest not found"
   exit
else
   echo "manifest found"
fi

rm -fr build
mkdir build

echo "copying files"

cp -r * build  2> /dev/null

echo "cleaning up"
#remove any build folder in build folder and build.sh
rm -fr build/build*
rm -fr build/$PROG.*.zip
rm -fr build/.DS_Store
rm -fr build/img/.DS_Store
rm -fr build/img_delete

echo "determining version number"
vers=`cat manifest.json | awk -f build.awk`

cd build

echo "Creating zip"
which zip
if [ $? -eq 0 ]; then
	zip -r "../$PROG.$vers.zip" *
else
	"c:\Program Files\WinRAR\WinRAR.exe" a -afzip -r "../$PROG.$vers.zip" *
fi

echo "Cleaning up temporary files ..."
cd ..
rm -rf build

echo "the built zip is now in the current directory"
mv "$PROG.$vers.zip" "../$PROG.$vers.zip"

echo "The built zip should be up one level from your current location"

cd ..
pwd
echo "the built zip is now in your builds folder one level up from pwd"

mv "$PROG.$vers.zip" "builds/$PROG.$vers.zip"

