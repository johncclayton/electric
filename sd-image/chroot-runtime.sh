#@IgnoreInspection BashAddShebang

set -e
set -u

# this runs the entire dev bootstrapping experience from within
# the chroot jail.  All the same benefits, all the same style.
/opt/rpi3-bootstrap.sh

# ensure SSH is enabled
sudo touch /boot/ssh

exit 0
