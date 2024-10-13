
# Wrap ttext files in js as text load is broken

src/editProfilePane/wrapped-profileFormText.ts : src/editProfilePane/profileFormText.ttl
	echo "export const profileFormText = \`" > $@
	cat src/editProfilePane/profileFormText.ttl >> $@
	echo '` ;' >> $@
