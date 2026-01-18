import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

def reset_password():
    print("Available users:")
    users = User.objects.all()
    for user in users:
        print(f"  - {user.username} (Email: {user.email})")
    
    print("\n" + "="*50)
    username = input("Enter username to reset password: ").strip()
    
    try:
        user = User.objects.get(username=username)
        new_password = input(f"Enter new password for '{username}': ").strip()
        confirm_password = input("Confirm new password: ").strip()
        
        if new_password != confirm_password:
            print("❌ Passwords don't match!")
            return
        
        if len(new_password) < 4:
            print("❌ Password too short (minimum 4 characters)")
            return
        
        user.set_password(new_password)
        user.save()
        print(f"✅ Password successfully reset for '{username}'!")
        print(f"You can now login with:")
        print(f"  Username: {username}")
        print(f"  Password: {new_password}")
        
    except User.DoesNotExist:
        print(f"❌ User '{username}' not found!")

if __name__ == "__main__":
    reset_password()
