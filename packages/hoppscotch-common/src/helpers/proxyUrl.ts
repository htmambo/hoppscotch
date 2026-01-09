import { platform } from "~/platform"
import * as E from "fp-ts/Either"

// Default proxy URL
export const DEFAULT_HOPP_PROXY_URL = "http://127.0.0.1:7890"

// Get default proxy URL from platform or return default
export const getDefaultProxyUrl = async () => {
  const proxyAppUrl = platform?.infra?.getProxyAppUrl

  if (proxyAppUrl) {
    const res = await proxyAppUrl()

    if (E.isRight(res)) {
      return res.right.value
    }

    return DEFAULT_HOPP_PROXY_URL
  }

  return DEFAULT_HOPP_PROXY_URL
}
