export const profileForm= `
@prefix os: <http://www.w3.org/2000/10/swap/os#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix schema: <http://schema.org/>.
@prefix vcard: <http://www.w3.org/2006/vcard/ns#>.

@prefix org: <http://www.w3.org/ns/org#>.
@prefix esco: <http://data.europa.eu/esco/model#>.
@prefix wd: <http://www.wikidata.org/entity/>.
@prefix wdt: <http://www.wikidata.org/prop/direct/>.

@prefix : <https://solidos.github.io/profile-pane/src/ontology/profileForm.ttl#>.
@prefix soc: <https://solidos.github.io/profile-pane/src/ontology/socialMedia.ttl#>.

# was: https://solidos.github.io/solid-panes/dashboard/profileStyle.ttl#this
# moved to:  https://solidos.github.io/profile-pane/src/ontology/profileForm.ttl#this




# About forms: https://solidos.github.io/solid-ui/Documentation/forms-intro.html
# About personal public data:  https://www.w3.org/DesignIssues/PersonalPublic.html
#

:this
    <http://purl.org/dc/elements/1.1/title> "Profile form" ;
    a ui:Form ;
    # ui:part :backgroundColor, :highlightColor;
    ui:parts (
      :styleGroup
      :nicknameField
      :pronounsForm
      :LanguagesPrompt :LanguagesForm
      :SocialsPrompt :SocialsForm
      :CVGroup
      :SkillsPrompt :SkillsForm
      ).

:styleGroup a ui:Group; ui:weight 0; ui:parts ( :styleHeading :backgroundColor :highlightColor ).
    :styleHeading a ui:Heading; ui:contents "The style of your public profile.".
    :backgroundColor a ui:ColorField; ui:property solid:profileBackgroundColor;
      ui:label "Background color"; ui:default "#ffffff".
    :highlightColor a ui:ColorField; ui:property solid:profileHighlightColor;
      ui:label "Highlight color"; ui:default "#000000".

# Nickname

:nicknameField a ui:SingleLineTextField; ui:maxLength "20"; ui:size 12; ui:property foaf:nick;
      ui:label "Short name for chats, etc."@en, "nom court"@fr.

 # Pronouns

 :pronounsForm a ui:Group; ui:weight 0; ui:parts ( :pronounsPrompt :subjectPronounForm :objectPronounForm :relativePronounForm) .

    :pronounsPrompt a ui:Comment; ui:contents  "What are your pronouns?" .

    :subjectPronounForm a ui:SingleLineTextField; ui:property solid:preferredSubjectPronoun;
        ui:size 10; ui:label "he/she/they..." .
    :objectPronounForm a ui:SingleLineTextField; ui:property solid:preferredObjectPronoun;
        ui:size 10; ui:label "him/her/them..." .
    :relativePronounForm a ui:SingleLineTextField; ui:property solid:preferredRelativePronoun;
        ui:size 10; ui:label "his/hers/theirs..." .

  # Curriculum Vitae: membership of organizations

  :CVHeading a ui:Heading; ui:contents "Public Curriculum Vitae".
  :CVPrompt a ui:Comment; ui:contents  "What organizations have you been involved with?" .

    :CVGroup a ui:Group; ui:weight 1; ui:parts ( :CVHeading :CVPrompt :involvementWithOrganizationsForm ).


  solid:Role a rdfs:Class; owl:oneOf ( solid:CurrentRole solid:FormerRole solid:FutureRole ). # Future Role too?

  org:member owl:inverse [ ui:label "involvement with company, org etc" ]. # timelimited involvement

  :involvementWithOrganizationsForm a ui:Multiple;
      ui:label "Involvement with Organization";
      ui:property org:member; ui:reverse true; # link back from role to member
      ui:ordered false; # Allow user to order CV secions rather than force date order? No.
      ui:part :RoleMembershipForm.

# This is a big important form for one of a series of roles in the list.

  :RoleMembershipForm a ui:Group; ui:weight 3; ui:parts ( :MembershipFormHeading :roleNameField
        :escoOccupationField :orgField :RoleClassifier :RoleDatesForm :RoleDescriptionForm).

     :MembershipFormHeading a ui:Heading; ui:contents "Details of this role"@en, "Détailes de ce rôle"@fr .

     :orgField a ui:Choice; ui:label "Organization"@en, "Organization"@fr;
          ui:canMintNew true; ui:use :OrganizationCreationForm ;
          ui:property org:organization;
          ui:from vcard:Organization .
     :roleNameField a ui:SingleLineTextField; ui:property vcard:role; ui:size 60 .

    :escoOccupationField a ui:AutocompleteField;
          ui:label "occupation"; ui:size 60;
          ui:property org:role;
          ui:dataSource :ESCO_Occupation_DataSource;
           ui:targetClass schema:Occupation .

         :ESCO_Occupation_DataSource a ui:DataSource;
            schema:name "ESCO";
            ui:targetClass schema:Occupation ;
            schema:logo <https://ec.europa.eu/esco/portal/static_resource2/images/logo/logo_en.gif>;
            ui:searchByNameURI "https://ec.europa.eu/esco/api/search?language=$(language)&type=occupation&text=$(name)".

     :instituteIdentityField a ui:AutocompleteField; ui:label "in wikidata";
          ui:size 60;
          ui:property solid:publicId; ui:dataSource :WikidataOnOrganizations.

     :WikidataOnOrganizations a ui:DataSource ;
       schema:name "Wikidata";
       ui:endpoint "https://query.wikidata.org/sparql" ;
       ui:targetClass  <http://www.wikidata.org/entity/Q43229>; # Use if nothing else
       ui:searchByNameQuery """SELECT ?subject ?name
       WHERE {
         ?klass wdt:P279* $(targetClass) .
         ?subject wdt:P31 ?klass .
         ?subject rdfs:label ?name.
         FILTER regex(?name, "$(name)", "i")
       } LIMIT $(limit) """ .

      :WikidataOnOrganizations ui:classMap
       [ ui:internalClass schema:Corporation; ui:externalClass <http://www.wikidata.org/entity/Q6881511>], #Enterprise is for-profit
       [ ui:internalClass schema:EducationalOrganization; ui:externalClass <http://www.wikidata.org/entity/Q178706>], #insitution
       [ ui:internalClass schema:ResearchOrganization; ui:externalClass <http://www.wikidata.org/entity/Q31855>], # reearch insitutie
       [ ui:internalClass schema:GovernmentOrganization; ui:externalClass <http://www.wikidata.org/entity/Q327333>], #government agency
       [ ui:internalClass schema:MedicalOrganization; ui:externalClass <http://www.wikidata.org/entity/Q4287745>],
       [ ui:internalClass schema:MusicGroup; ui:externalClass <http://www.wikidata.org/entity/Q32178211>], #music organization
       [ ui:internalClass schema:NGO; ui:externalClass <http://www.wikidata.org/entity/Q163740>], #nonprofit organization @@
       [ ui:internalClass schema:Occupation; ui:externalClass <http://www.wikidata.org/entity/Q28640>], # superclass: Profession
       [ ui:internalClass schema:Organization; ui:externalClass <http://www.wikidata.org/entity/Q43229>], # Superclass; Organization
       [ ui:internalClass schema:Project; ui:externalClass <http://www.wikidata.org/entity/Q170584>],
       [ ui:internalClass schema:SportsOrganization; ui:externalClass <http://www.wikidata.org/entity/Q4438121>] .


# eposodes in one's career - Roles

solid:Role owl:disjointUnionOf ( solid:PastRole solid:CurrentRole solid:FutureRole ) .
solid:PastRole a rdfs:Class; rdfs:label "former role"@en, "ancien rôle"@fr, "vergangene Rolle"@de, "rol anterior"@es .
solid:CurrentRole a rdfs:Class; rdfs:label "current role"@en, "rôle actuel"@fr, "momentane Rolle"@de , "rol actual"@es .
solid:FutureRole a rdfs:Class; rdfs:label "future role"@en, "rôle à venir"@fr, "zukünftige Rolle"@de, "rol futuro"@es .

:RoleDatesGroup a ui:Group; ui:weight 0; ui:parts ( :RoleClassifier :RoleDatesForm ) .
  :RoleClassifier a ui:Classifier; ui:label "What sort of role?"@en;
      ui:category solid:Role .

  :RoleDatesForm a ui:Options; ui:dependingOn rdf:type; ui:case
     [ ui:for solid:PastRole; ui:use :TwoDateForm ],
     [ ui:for solid:CurrentRole; ui:use :StartDateForm ],
     [ ui:for solid:FutureRole; ui:use :StartDateForm ].

      :StartDateForm a ui:DateField; ui:label "start"@en,"début"@fr;
          ui:property schema:startDate .
      :TwoDateForm a ui:Group; ui:weight 0; ui:parts ( :StartDateForm :EndDateForm ) .
      :EndDateForm a ui:DateField; ui:label "end"@en,"fin"@fr;
          ui:property schema:endDate .

:RoleDescriptionForm a ui:MultiLineTextField; ui:property schema:description;
  ui:label "Describe your role" .

# Organizations

 vcard:Organization ui:creationForm :OrganizationCreationForm  .

# Ontology data to drive the classifier

solid:InterestingOrganization owl:disjointUnionOf  (
# Airline - a Corporation
# Consortium - a Corporation or a NGO
 schema:Corporation
 schema:EducationalOrganization
 schema:ResearchOrganization  # Proposed. https://github.com/schemaorg/schemaorg/issues/2877
# FundingScheme - eh?
 schema:GovernmentOrganization
# LibrarySystem
# LocalBusiness - Corporation
# MedicalOrganization - a Corporation or a NGO
 schema:NGO
 # NewsMediaOrganization - a Corporation or a NGO
schema:PerformingGroup # a band
schema:Project # like Solid
schema:SportsOrganization # a Team
solid:OtherOrganization
 ) .

# This until the schema.org ontology adopts it
schema:ResearchOrganization a rdfs:Class; rdfs:label "Research Organization"@en, "Organization de Recherche"@fr ,
   "organización de investigación"@es, "منظمة البحث"@ar, "अनुसंधान संगठन"@hi, "Forschungsorganisation"@de, "shirika la utafiti"@sw .

  :OrganizationCreationForm a ui:Form; schema:name "Form for editing an organization using public data" ;
    ui:parts ( :OrgClassifier :OrgSwitch   :OrganizationNameField :homePageURIField  ) .


 :OrgClassifier a ui:Classifier; ui:label "What sort of organization?"@en;
    ui:category solid:InterestingOrganization .

  :OrganizationNameField
      a ui:SingleLineTextField ;
      ui:label "Organization Name";
      ui:maxLength "200" ;
      ui:property schema:name ;
      ui:size    80 .

   :homePageURIField a ui:NamedNodeURIField; ui:size 80;
      ui:label "Home page URI"@en;
      ui:property  schema:uri . # @@ ??

    :initituteTypeField a ui:Classifier;
    ui:label "What sort of organization";
    ui:category solid:InterestingOrganization .

#  Depending on the type of org, chose a different form

 :OrgSwitch a ui:Options; ui:dependingOn rdf:type;
   ui:case
   [ ui:for schema:Corporation; ui:use :CorporationForm ],
   [ ui:for schema:GovernmentOrganization; ui:use :GovernmentOrganizationForm ],
   [ ui:for schema:PerformingGroup; ui:use :PerformingGroupForm ],
   [ ui:for schema:Project; ui:use :ProjectForm ],
   [ ui:for schema:NGO; ui:use :NGOForm ],
   [ ui:for schema:EducationalOrganization; ui:use :EducationalOrganizationForm ],
   [ ui:for schema:ResearchOrganization; ui:use :ResearchOrganizationForm ],
   [ ui:for :SportsOrganization; ui:use :SportsOrganizationForm ],
   [ ui:for solid:OtherOrganization; ui:use :OtherOrganizationForm ].


  :CorporationForm a ui:Group; ui:weight 0; ui:parts ( :CorporationPrompt :CorporationAutocomplete ) .

      :CorporationPrompt a ui:Comment; ui:contents "Which corporation?".

      :CorporationAutocomplete a ui:AutocompleteField;
      a ui:AutocompleteField; ui:label "Corporation in wikidata";
           ui:size 60;
           ui:targetClass  <http://www.wikidata.org/entity/Q6881511>; # Enterprise
           ui:property solid:publicId; ui:dataSource :WikidataInstancesByName.

      :WikidataInstancesByName a ui:DataSource ;
        schema:name "Wikidata instances by name";
        ui:endpoint "https://query.wikidata.org/sparql" ;
        ui:searchByNameQuery """SELECT ?subject ?name
        WHERE {
          ?klass wdt:P279* $(targetClass) .
          ?subject wdt:P31 ?klass .
          ?subject rdfs:label ?name.
          FILTER regex(?name, "$(name)", "i")
        } LIMIT $(limit) """ ;

        # Note this form of the query is very experimental
        ui:searchByName [   ui:construct { ?subject schema:name ?name } ;
                            ui:where { ?klass wdt:P279 ?targetClass .
                                       ?subject wdt:P31 ?klass; rdfs:label ?name .
                                     };
                        ].

  :GovernmentOrganizationForm a ui:Group; ui:weight 0; ui:parts ( :GovernmentOrganizationPrompt :GovernmentOrganizationAutocomplete ) .

      :GovernmentOrganizationPrompt a ui:Comment; ui:contents "Which GovernmentOrganization?".

      :GovernmentOrganizationAutocomplete
      a ui:AutocompleteField; ui:label "GovernmentOrganization in wikidata";
           ui:size 60;
           ui:targetClass  <http://www.wikidata.org/entity/Q327333>; # GovernmentOrganization
           ui:property solid:publicId; ui:dataSource :WikidataInstancesByName.

    :EducationalOrganizationForm a ui:Group; ui:weight 1; ui:parts ( :EducationalOrganizationPrompt :EducationalOrganizationAutocomplete ) .

        :EducationalOrganizationPrompt a ui:Comment; ui:contents "Which Educational Organization?".

        :EducationalOrganizationAutocomplete
        a ui:AutocompleteField; ui:label "Educational Organization in wikidata";
             ui:size 60;
             ui:targetClass  <http://www.wikidata.org/entity/Q2385804>; # EducationalOrganization
             ui:property solid:publicId; ui:dataSource :WikidataInstancesByName.


    :ResearchOrganizationForm a ui:Group; ui:weight 0; ui:parts ( :ResearchOrganizationPrompt :ResearchOrganizationAutocomplete ) .

        :ResearchOrganizationPrompt a ui:Comment; ui:contents "Which Research Organization?".

        :ResearchOrganizationAutocomplete
        a ui:AutocompleteField; ui:label "Research Insitute in wikidata";
             ui:size 60;
             ui:targetClass  <http://www.wikidata.org/entity/Q31855>; # research institute
             ui:property solid:publicId; ui:dataSource :WikidataInstancesByName.


  :NGOForm a ui:Group; ui:weight 0; ui:parts ( :NGOPrompt :NGOAutocomplete ) .

      :NGOPrompt a ui:Comment; ui:contents "Which NGO?".

      :NGOAutocomplete
      a ui:AutocompleteField; ui:label "NGO in wikidata";
           ui:size 60;
           ui:targetClass  <http://www.wikidata.org/entity/Q163740>; # Non-profit org
           ui:property solid:publicId; ui:dataSource :WikidataInstancesByName.

  :PerformingGroupForm a ui:Group; ui:weight 0; ui:parts ( :PerformingGroupPrompt :PerformingGroupAutocomplete ) .

      :PerformingGroupPrompt a ui:Comment; ui:contents "Which PerformingGroup?".

      :PerformingGroupAutocomplete
      a ui:AutocompleteField; ui:label "PerformingGroup in wikidata";
           ui:size 60;
           ui:targetClass  <http://www.wikidata.org/entity/Q32178211>; # Music Org
           ui:property solid:publicId; ui:dataSource :WikidataInstancesByName.


  :ProjectForm a ui:Group; ui:weight 0; ui:parts ( :ProjectPrompt :ProjectAutocomplete ) . #  :ProjectAutocomplete - no: supress, as not in WD

      :ProjectPrompt a ui:Comment; ui:contents "Which Project?".

      :ProjectAutocomplete
      a ui:AutocompleteField; ui:label "Project in wikidata";
           ui:size 60;
           ui:targetClass  <http://www.wikidata.org/entity/Q170584>; # Project
           ui:property solid:publicId; ui:dataSource :WikidataInstancesByName.

  :SportsOrganizationForm a ui:Group; ui:weight 0; ui:parts ( :SportsOrganizationPrompt :SportsOrganizationAutocomplete ) .

      :SportsOrganizationPrompt a ui:Comment; ui:contents "Which Sports Organization?".

      :SportsOrganizationAutocomplete
      a ui:AutocompleteField; ui:label "SportsOrganization in wikidata";
           ui:size 60;
           ui:targetClass  <http://www.wikidata.org/entity/Q4438121>; # SportsOrganization
           ui:property solid:publicId; ui:dataSource :WikidataInstancesByName.

   :OtherOrganizationForm a ui:Group; ui:weight 0; ui:parts ( :OrganizationNameField :homePageURIField ) .

  #################### Skills

  :SkillsPrompt a ui:Comment; ui:contents  "Skills?" .

  :SkillsForm a ui:Multiple;
      ui:label "Skills";
      ui:property schema:skills;
      ui:ordered false; # Allow reader to order skills
      ui:part :SkillForm.

  :SkillForm a ui:Group; ui:weight 1; ui:parts ( :escoSkillField ).

        # :skillNameField a ui:SingleLineTextField; ui:property vcard:role; ui:size 30 .

        :escoSkillField a ui:AutocompleteField;
              ui:label "skill"; ui:size 30;
              ui:property solid:publicId;
              ui:dataSource :ESCO_Skill_DataSource;
               ui:targetClass schema:Skill .

        :ESCO_Skill_DataSource a ui:DataSource;
           schema:name "ESCO Skill";
           ui:targetClass esco:Skill ;
           schema:logo <https://ec.europa.eu/esco/portal/static_resource2/images/logo/logo_en.gif>;
           ui:searchByNameURI "https://ec.europa.eu/esco/api/search?language=$(language)&limit=$(limit)&type=skill&text=$(name)".

# Language

:LanguagesPrompt a ui:Comment; ui:contents  "Languages?" .

:LanguagesForm a ui:Multiple;
    ui:label "Languages";
    ui:property schema:knowsLanguage; # @@@
    ui:ordered true; # Allow user to order languages most important first.
    ui:part :LanguageForm.

:LanguageForm a ui:Group; ui:weight 1; ui:parts ( :WikidataLanguageField ).

    :WikidataLanguageField a ui:AutocompleteField;
          ui:label "Language"; ui:size 30;
          ui:property solid:publicId; # @@
          ui:dataSource :WikidataLanguageDataSource;
           ui:targetClass schema:Language .

    :WikidataLanguageDataSource
        schema:name "Wikidata languages";
        ui:endpoint "https://query.wikidata.org/sparql" ;
        ui:objectURIBase <https://www.w3.org/ns/iana/language-code/>;
        # Add this to any literal string returned as ?subject

         ui:searchByNameQuery """SELECT ?item ?subject ?name
WHERE
{ ?item wdt:P305 ?subject .
  OPTIONAL {?item rdfs:label ?name}
  OPTIONAL {?item wdt:P1705 ?name}
  FILTER regex(?name, "$(name)", "i")
  FILTER regex(?subject, "^..$", "i")
}""" .
 # Note we restrict code to two-letter codes with the second regex, so as to limit the deluge of languages
 # Hope there are not any important ones which have three-letter codes.
 # Omitted: SERVICE wikibase:label { bd:serviceParam wikibase:language "$(languages)". }

########### Social Media - other accounts
#
# Twitter, Linked In, Orkid, Mastodon, Matrix, Bluesky, Instagram, Facebook, Github,
# Snapchat, TikTok, etc

:SocialsPrompt a ui:Heading; ui:contents  "Social Media etc?" .
:SocialsPrompt a ui:Comment; ui:contents  "Link to accounts in social media sites, etc" .

:SocialsForm a ui:Multiple;
    ui:label "online account";
    ui:property foaf:account;
    ui:ordered true; # Allow user to order occounts most important first.
    ui:part :AccountsForm.

:AccountsForm a ui:Group; ui:weight 1; ui:parts ( :AccountField :AccountIdField ).

:AccountField a ui:Classifier; ui:label "What sort of account?"@en;
      ui:multiple false ; 
      ui:category foaf:Account  .

:AccountIdField a ui:Options . 

  :AccountIdField a ui:Options; ui:dependingOn rdf:type; ui:case
     [ ui:for soc:BlueSkyAccount; ui:use :BlueSkyIdField ],
     [ ui:for soc:FacebookAccount; ui:use :FacebookIdField ],
     [ ui:for soc:GithubAccount; ui:use :GithubIdField ],
     [ ui:for soc:InstagramAccount; ui:use :InstagramIdField ],
     [ ui:for soc:LinkedInAccount; ui:use :LinkedInIdField ],
     [ ui:for soc:MastodonAccount; ui:use :MastodonIdField ],
     [ ui:for soc:MatrixAccount; ui:use :MatrixIdField ],
     [ ui:for soc:MediumAccount; ui:use :MediumIdField ],
     [ ui:for soc:NostrAccount; ui:use :NostrIdField ],
     [ ui:for soc:OrcidAccount; ui:use :OrcidIdField ],
     [ ui:for soc:PinterestAccount; ui:use :PinterestIdField ],
     [ ui:for soc:RedditAccount; ui:use :RedditIdField ],
     [ ui:for soc:StravaAccount; ui:use :StravaIdField ],
     [ ui:for soc:SnapchatAccount; ui:use :SnapchatIdField ],
     [ ui:for soc:TiktokAccount; ui:use :TiktokIdField ],
     [ ui:for soc:TumblrAccount; ui:use :TumblrIdField ],
     [ ui:for soc:TwitterAccount; ui:use :TwitterIdField ],
     [ ui:for soc:OtherAccount; ui:use :OtherIdForm  ] .

  :BlueSkyIdField
      a ui:SingleLineTextField ;
      ui:label "Bluesky Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "@[a-z0-9A-Z_-](.[a-z0-9A-Z_-])*";  # @@
      ui:size    40 .

  :FacebookIdField
      a ui:SingleLineTextField ;
      ui:label "Facebook Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

  :GithubIdField
      a ui:SingleLineTextField ;
      ui:label "Github Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

  :InstagramIdField
      a ui:SingleLineTextField ;
      ui:label "Instagram Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

  :LinkedInIdField
      a ui:SingleLineTextField ;
      ui:label "Linked In Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "[a-z0-9A-Z_-]*(.[a-z0-9A-Z_-])*";  # @@
      ui:size    40 .

  :MastodonIdField
      a ui:SingleLineTextField ;
      ui:label "Mastodon (Activity Pub) Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "@[a-z0-9A-Z_-]*(.[a-z0-9A-Z_-])*";  # @@
      ui:size    40 .

  :MatrixIdField
      a ui:SingleLineTextField ;
      ui:label "Matrix Username";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "@[a-z0-9A-Z_-]*(.[a-z0-9A-Z_-])*";  # @@
      ui:size    40 .

  :MediumIdField
      a ui:SingleLineTextField ;
      ui:label "Medium Username";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "@[a-z0-9A-Z_-]*(.[a-z0-9A-Z_-])*";  # @@
      ui:size    40 .

  :NostrIdField
      a ui:SingleLineTextField ;
      ui:label "Nostr public key";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "[a-z0-9A-Z_-]*(.[a-z0-9A-Z_-])*";  # @@
      ui:size    70 .

  :OrcidIdField
      a ui:SingleLineTextField ;
      ui:label "ORCiD id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

  :PinterestIdField
      a ui:SingleLineTextField ;
      ui:label "Pinterest id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

  :RedditIdField
      a ui:SingleLineTextField ;
      ui:label "Reddit Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

  :StravaIdField
      a ui:SingleLineTextField ;
      ui:label "Strava Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

  :SnapchatIdField
      a ui:SingleLineTextField ;
      ui:label "Snapchat Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "@[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

  :TiktokIdField
      a ui:SingleLineTextField ;
      ui:label "Tiktok Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "@[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

  :TumblrIdField
      a ui:SingleLineTextField ;
      ui:label "Tumblr user name";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "@[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

  :TwitterIdField
      a ui:SingleLineTextField ;
      ui:label "Twitter Id";
      ui:maxLength "200" ;
      ui:property foaf:accountName ; 
      ui:pattern "@[a-z0-9A-Z_-]*";  # @@
      ui:size    40 .

# an unknown SN account needs more info

  :OtherIdForm a ui:Group; ui:weight 0; ui:parts ( :OtherIdField :OtherIconField :OtherLabelield ).

  :OtherIdField
      a ui:NamedNodeURIField ;
      ui:label "URL of account to link to";
      ui:maxLength "200" ;
      ui:property foaf:homepage ; 
      ui:size    60 .

  :OtherLabelield
      a ui:SingleLineTextField ;
      ui:label "Label";
      ui:maxLength "200" ;
      ui:property rdfs:label ; 
      ui:size    40 .

  :OtherIconField
      a ui:NamedNodeURIField ;
      ui:label "URL of icon to display";
      ui:maxLength "200" ;
      ui:property foaf:icon ;
      ui:size    60 .





# ENDS
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix ui: <http://www.w3.org/ns/ui#>.
@prefix schema: <http://schema.org/>.
@prefix vcard: <http://www.w3.org/2006/vcard/ns#>.

@prefix org: <http://www.w3.org/ns/org#>.

@prefix : <https://solidos.github.io/profile-pane/src/ontology/socialMedia.ttl#>.
@prefix soc: <https://solidos.github.io/profile-pane/src/ontology/socialMedia.ttl#>.

# was: https://solidos.github.io/solid-panes/dashboard/profileStyle.ttl#  <-- change old data



# was: https://solidos.github.io/solid-panes/dashboard/profileStyle.ttl#this
# moved to:  https://solidos.github.io/profile-pane/src/ontology/profileForm.ttl#this
#  and        https://solidos.github.io/profile-pane/src/ontology/socialMedia.ttl


##### Ontology of Online Accounts

foaf:Account a rdfs:Class;
    rdfs:label "Online Account Provider";
    owl:disjointUnionOf ( :BlueSkyAccount :FacebookAccount :GithubAccount :InstagramAccount
    :LinkedInAccount :MastodonAccount :MatrixAccount :MediumAccount :NostrAccount :OrcidAccount :PinterestAccount
    :RedditAccount :SnapchatAccount :StravaAccount :TiktokAccount  :TumblrAccount  :TwitterAccount :OtherAccount) .

:BlueSkyAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Bluesky";
    foaf:userProfilePrefix "https://bsky.app/profile/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/bluesky-1.svg>;
    foaf:homepage <https://bsky.app/> .

:FacebookAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Facebook";
    foaf:userProfilePrefix "https://www.facebook.com/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/facebook-2020-2-1.svg>;
    foaf:homepage <https://www.facebook.com/> .

:GithubAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Github";
    foaf:userProfilePrefix "https://www.github.com/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/github-icon.svg>;
    foaf:homepage <https://github.com/> .

:InstagramAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Instagram";
    foaf:userProfilePrefix "https://www.instagram.com/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/instagram-2016-5.svg>;
    foaf:homepage <https://www.instagram.com/> .

:LinkedInAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Linked In";
    foaf:userProfilePrefix "https://www.linkedin.com/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/linkedin-icon.svg>;
    foaf:homepage <https://linkedin.com/> .

:MastodonAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Mastodon" ;
    foaf:userProfilePrefix "https://mastodon.social/";

 #   foaf:userNamePattern "(@[a-ZA-Z0-9]*)@[a-ZA-Z0-9.]*)";
 #   foaf:userNameTransform "https://$2/$1";

    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/mastodon-2.svg>;
    foaf:homepage <https://joinmastodon.org/> .

:MatrixAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Matrix" ;
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/matrix-logo-black.svg> ;
    foaf:userProfilePrefix "https://matrix.to/#/" ;
    foaf:homepage <https://matrix.org/> .

:MediumAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Medium";
    foaf:userProfilePrefix "https://medium.com/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/medium-logo-wordmark-black.svg>;
    foaf:homepage <https://medium.com/> .

:NostrAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Nostr";
    foaf:userProfilePrefix "https://primal.net/p/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/nostr-icon-purple-on-white.svg>;
    foaf:homepage <https://nostr.net/> .

:OrcidAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "ORCiD";
    foaf:userProfilePrefix "https://orcid.org/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/ORCID-1.svg>;
    foaf:homepage <https://orcid.org/> .

:PinterestAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Pinterest";
    foaf:userProfilePrefix "https://pin.it/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/pinterest-2-1.svg>;
    foaf:homepage <https://pinterest.com/> .

:RedditAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Reddit";
    foaf:userProfilePrefix "https://www.reddit.com/user/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/reddit-4.svg>;
    foaf:homepage <https://reddit.com/> .

:SnapchatAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Snapchat";
    foaf:userProfilePrefix "https://www.snapchat.com/add/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/snapchat-1.svg>;
    foaf:homepage <https://www.snapchat.com/> .

:StravaAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Strava";
    foaf:userProfilePrefix "https://www.strava.com/athletes/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/strava-2.svg>;
    foaf:homepage <https://strava.com/> .

:TiktokAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "TikTok";
    foaf:userProfilePrefix "https://www.tiktok.com/@";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/tiktok-icon-2.svg>;
    foaf:homepage <https://www.tiktok.com/> .

:TumblrAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Tumblr";
    foaf:userProfilePrefix "https://www.tumblr.com/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/tumblr-icon.svg>;
    foaf:homepage <https://www.tumblr.com/> .


:TwitterAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "X (formerly Twitter)";
    foaf:userProfilePrefix "https://x.com/";
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/x-2.svg>;
    foaf:homepage <https://x.com/> .


:OtherAccount rdfs:subClassOf foaf:Account ;
    rdfs:label "Other" ;
    foaf:icon <https://solidos.github.io/solid-ui/src/icons/noun_1689339.svg> .

# ends

` ;
