import { useEffect } from 'react'
import { SITE } from '../siteConfig'

const ORIGIN = `https://${SITE.domain}`

function setMeta(selector, attr, key, value) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

/**
 * Per-page <title>, description, canonical URL and robots tag.
 * index.html holds the home page defaults for crawlers that do not run
 * JavaScript (link previews in WhatsApp, Slack, etc.). Google renders the
 * JavaScript and picks up these per-page values.
 */
export default function usePageMeta({ title, description, path, noindex = false }) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE.name}` : `${SITE.name} | Xactimate Estimation Services`
    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description)
      setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    }
    setMeta('meta[property="og:title"]', 'property', 'og:title', document.title)
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, follow' : 'index, follow')

    if (path) {
      let link = document.head.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', `${ORIGIN}${path}`)
      setMeta('meta[property="og:url"]', 'property', 'og:url', `${ORIGIN}${path}`)
    }
  }, [title, description, path, noindex])
}
