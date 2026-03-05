# Ensure SSL_CERT_FILE is set so Ruby/CocoaPods can verify https://cdn.cocoapods.org
# Use this when you see: "certificate verify failed (unable to get local issuer certificate)"
if [ -z "$SSL_CERT_FILE" ]; then
  if [ -f /private/etc/ssl/cert.pem ]; then
    export SSL_CERT_FILE=/private/etc/ssl/cert.pem
  elif [ -n "$(command -v brew)" ] && [ -f "$(brew --prefix openssl@3 2>/dev/null)/etc/openssl/cert.pem" ]; then
    export SSL_CERT_FILE="$(brew --prefix openssl@3)/etc/openssl/cert.pem"
  elif [ -n "$(command -v brew)" ] && [ -f "$(brew --prefix openssl 2>/dev/null)/etc/openssl/cert.pem" ]; then
    export SSL_CERT_FILE="$(brew --prefix openssl)/etc/openssl/cert.pem"
  fi
fi
