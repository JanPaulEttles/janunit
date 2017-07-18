/*
keytool -import -trustcacerts -file /home/jan/janunit/janapp/owasp_zap_root_ca.cer -alias zap -keystore /home/jan/janunit/janapp/zap.jks

Generate a private key
openssl genrsa -des3 -out ca.key 2048

Generate the csr (Certificate Signing Request)
openssl req -new -key ca.key -out ca.csr

Generate self-signed SSL certificate 
openssl x509 -req -days 365 -in ca.csr -out ca.crt -signkey ca.key

openssl genrsa -des3 -out server.key 2048
openssl req -new -key server.key -out server.csr
cp server.key server.key.passphrase
remove the passphrase
openssl rsa -in server.key.passphrase -out server.key
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

Update the hosts file with the domain
echo "127.0.0.1 localhost.ssl" | sudo tee -a /etc/hosts


openssl x509 -in ca.crt -out ca.pem
keytool -import -alias localhost.ssl -keystore zap.jks -file ca.pem


With the app running, fetch the cert
echo QUIT | openssl s_client -connect localhost.ssl:3000 | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > janunitcacert.pem
Use the cert within curl to test
curl --cacert janunitcacert.pem https://localhost.ssl:3000/index.html

With the app running, and zap running, fetch the zap cert
curl http://localhost:8080/OTHER/core/other/rootcert/?formMethod=GET > zap.pem
test with curl specifying zap as the proxy
curl --proxy localhost.ssl:8080 --cacert zap.pem https://localhost.ssl:3000/index.html

You should see an entry in zap history
*/

