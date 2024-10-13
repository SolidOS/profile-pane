
# Wrap ttext files in js as text load is broken

src/editProfilePane/wrapped-profileFormText.js : src/editProfilePane/profileFormText.ttl
	echo "export profileFormText = \`" > $@
	cat src/editProfilePane/profileFormText.ttl >> $@
	echo '\` ;' >> $@
