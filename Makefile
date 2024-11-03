
# Wrap text files in js as text load is broken

src/editProfilePane/wrapped-profileFormText.ts : src/ontology/profileForm.ttl src/ontology/socialMedia.ttl 
	echo "export const profileForm= \`" > $@
	cat src/ontology/profileForm.ttl >> $@
	cat src/ontology/socialMedia.ttl >> $@
	echo '` ;' >> $@
