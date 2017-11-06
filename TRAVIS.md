How it works
============

Make up a pub/priv key pair on the build box.  Install RVM to make installing Ruby easier.  Then install Ruby latest and:

    gem install travis

Once you've got travis installed, encrypt the private key - if we assume that is travis_rsa.pem, then the encrypted file
goes into travis_rsa.pem.enc, the .enc file is to be included in Git - throw the other one out. 

Decrypt it using the build script - the IV/KEY values required come from the Travis account as env vars. 


