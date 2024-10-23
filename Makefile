
# Wrap ttext files in js as text load is broken

src/editProfilePane/wrapped-profileFormText.ts : src/editProfilePane/profileFormText.ttl src/editProfilePane/socialMedia.ttl 
	echo "export const profileFormText = \`" > $@
	cat src/editProfilePane/profileFormText.ttl >> $@
	cat src/editProfilePane/socialMedia.ttl >> $@
	echo '` ;' >> $@
