import Document from 'next/document'
import { ServerStyleSheet } from 'styled-components'
import { ReactNodeArray } from 'react'

export default class MyDocument extends Document {
  static async getInitialProps (ctx) {
    const sheet = new ServerStyleSheet()

    const originalRenderPage = ctx.renderPage
    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: App => props => sheet.collectStyles(<App {...props} />)
      })

    const initialProps = await Document.getInitialProps(ctx)
    const styles = initialProps.styles as ReactNodeArray;
    return {
      ...initialProps,
      styles: [...styles, ...sheet.getStyleElement()]
    }
  }
}
