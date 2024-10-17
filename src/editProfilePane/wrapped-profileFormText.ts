export const profileFormText = `
# 20210404a
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

@prefix : <#>.

:this
    <http://purl.org/dc/elements/1.1/title> "Profile form" ;
    a ui:Form ;
    # ui:part :backgroundColor, :highlightColor;
    ui:parts (
      :styleGroup
      :nicknameField
      :pronounsForm
      :LanguagesPrompt :LanguagesForm
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

:nicknameField a ui:SingleLineTextField; ui:size 12; ui:property foaf:nick;
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


# ENDS
` ;
