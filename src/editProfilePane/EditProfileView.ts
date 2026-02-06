/**
 * Profile Editing App Pane
 *
 * Unlike view panes, this is available any place whatever the real subject,
 * and allows the user to edit their own profile.
 *
 * Usage: paneRegistry.register('/profile/editProfile.view)
 * or standalone script adding onto existing mashlib.
 */

import { PaneDefinition } from 'pane-registry'
import { NamedNode, parse, Store, sym } from 'rdflib'
import { icons, login, ns, widgets } from 'solid-ui'
import { EditProfileContactSection } from './EditProfileCard'
import { EditProfileSocialSection } from './EditFriendsCard'
import { EditProfileCommunitiesSection } from './EditCommunitiesCard'
import profileForm from '../ontology/profileForm.ttl'
import '../styles/utilities.css'

const editProfileView: PaneDefinition = {
  global: true,

  icon: icons.iconBase + 'noun_492246.svg',

  name: 'editProfile',

  label: () => null, // don't use this in the normal solid-panes dispatching

  render: function (subject, context) {
    //console.log('@@@ render edit profile pane:  subject, context', subject, context)
    const dom = context.dom
    const store = context.session.store as Store

    function complainIfBad (ok: boolean, mess: string) {
      if (ok) return
      div.appendChild(widgets.errorMessageBlock(dom, mess, '#fee'))
    }

    function renderProfileForm (div: HTMLElement, subject: NamedNode) {
      const preferencesForm = sym('https://solidos.github.io/profile-pane/src/ontology/profileForm.ttl#this')
      const preferencesFormDoc = preferencesForm.doc()
      if (!store.holds(undefined, undefined, undefined, preferencesFormDoc)) {
        // If not loaded already
        parse(profileForm, store, preferencesFormDoc.uri, 'text/turtle', () => null) // Load form directly
      }
      div.setAttribute('data-testid', 'profile-editor')
      // @@ div.append?
      widgets.appendForm(
        dom,
        div,
        {},
        subject,
        preferencesForm,
        editableProfile,
        complainIfBad
      )
    } // renderProfileForm

    // Use <section> as the main container for better semantics
    const div = dom.createElement('section')
    div.setAttribute('data-testid', 'profile-editor')
    div.setAttribute('role', 'region')
    div.setAttribute('aria-label', 'Edit your profile')
    let editableProfile: NamedNode | null


    // Use <main> for the main content area, styled as a grid like ProfileView
    const main = dom.createElement('main')
    main.setAttribute('id', 'profile-edit-main-content')
    main.classList.add('profile-grid')
    div.appendChild(main)

    // Use <aside> for the status area
    const statusArea = dom.createElement('aside')
    statusArea.classList.add('p-sm')
    statusArea.setAttribute('aria-live', 'polite')
    div.appendChild(statusArea)

    const profileContext = {
      dom: dom,
      div: main,
      statusArea: statusArea,
      me: null
    }
    login.ensureLoadedProfile(profileContext)
      .then(theContext => {
        const me = theContext.me!

        const profile = me.doc()
        if (!store.updater) {
          throw new Error('Store has no updater')
        }
        if (store.any(me, ns.solid('editableProfile'))) {
          editableProfile = store.any(me, ns.solid('editableProfile')) as NamedNode
        } else if (store.updater.editable(profile.uri, store)) {
          editableProfile = profile
        } else {
          statusArea.appendChild(widgets.errorMessageBlock(dom, `⚠️ Your profile ${profile} is not editable, so we cannot do much here.`, 'straw'))
          return
        }

        // Render each section as a card with consistent classes
        // Your contact information Section
        main.appendChild(EditProfileContactSection(context, me))

         // Edit socials, CV, Skills
        // Render the editable profile form as a card/section
        const formSection = dom.createElement('section')
        formSection.classList.add('profileSection', 'section-bg')
        formSection.setAttribute('aria-labelledby', 'edit-profile-form-heading')
        const formHeader = dom.createElement('header')
        formHeader.classList.add('text-center', 'mb-md')
        const formHeading = dom.createElement('h2')
        formHeading.id = 'edit-profile-form-heading'
        formHeading.classList.add('section-title')
        formHeading.textContent = 'Edit preferences, pronouns, bio'
        formHeader.appendChild(formHeading)
        formSection.appendChild(formHeader)
        
        renderProfileForm(formSection, me)
        main.appendChild(formSection)

        // People you know Section
        main.appendChild(EditProfileSocialSection(context, me, editableProfile, profile))
        // Communities you participate in Section
        main.appendChild(EditProfileCommunitiesSection(context, me, editableProfile, profile))

       
      }).catch(error => {
        statusArea.appendChild(widgets.errorMessageBlock(dom, error, '#fee'))
      })
    return div
  }
}

export default editProfileView
