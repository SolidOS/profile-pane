import { describe, expect, it, vi } from "vitest"
import { createResumeOrganizationOptionsProvider } from "../../src/sections/resume/ResumeEditDialog"

describe("Resume organization option provider", () => {
  it('filters Wikidata organization suggestions by the selected organization type', async () => {
    const searchPayload = {
      search: [
        {
          id: 'Q100001',
          label: 'SolidOS Inc',
          concepturi: 'http://www.wikidata.org/entity/Q100001'
        },
        {
          id: 'Q100002',
          label: 'SolidOS University',
          concepturi: 'http://www.wikidata.org/entity/Q100002'
        }
      ]
    }

    const entityPayload = {
      entities: {
        Q100001: {
          claims: {
            P31: [
              {
                mainsnak: {
                  snaktype: 'value',
                  datavalue: {
                    value: { id: 'Q6881511' }
                  }
                }
              }
            ]
          }
        },
        Q100002: {
          claims: {
            P31: [
              {
                mainsnak: {
                  snaktype: 'value',
                  datavalue: {
                    value: { id: 'Q178706' }
                  }
                }
              }
            ]
          }
        }
      }
    }

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => searchPayload } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => entityPayload } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ entities: {} }) } as Response)

    const corporationProvider = createResumeOrganizationOptionsProvider(() => 'Corporation')
    const corporationSuggestions = await corporationProvider('solid')

    expect(corporationSuggestions).toEqual([
      {
        label: 'SolidOS Inc',
        value: 'http://www.wikidata.org/entity/Q100001'
      }
    ])

    fetchMock.mockReset()
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => searchPayload } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => entityPayload } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ entities: {} }) } as Response)

    const educationalProvider = createResumeOrganizationOptionsProvider(() => 'EducationalOrganization')
    const educationalSuggestions = await educationalProvider('solid')

    expect(educationalSuggestions).toEqual([
      {
        label: 'SolidOS University',
        value: 'http://www.wikidata.org/entity/Q100002'
      }
    ])
  })
})
