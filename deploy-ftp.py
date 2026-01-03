#!/usr/bin/env python3
"""
Script de déploiement FTP automatique pour JobGuinee
Utilise les credentials du fichier .env
"""

import ftplib
import os
import sys
from pathlib import Path

def load_env_vars():
    """Charge les variables d'environnement depuis .env"""
    env_vars = {}

    if not os.path.exists('.env'):
        print("❌ Fichier .env introuvable")
        sys.exit(1)

    with open('.env', 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()

    host = env_vars.get('HOSTINGER_FTP_HOST', '').replace('ftp://', '').replace('ftps://', '')
    username = env_vars.get('HOSTINGER_FTP_USERNAME')
    password = env_vars.get('HOSTINGER_FTP_PASSWORD')

    if not all([host, username, password]):
        print("❌ Erreur: Variables FTP manquantes dans .env")
        sys.exit(1)

    return host, username, password

def upload_directory(ftp, local_dir, remote_dir='/public_html'):
    """Upload récursif d'un répertoire"""
    print(f"\n📁 Upload de {local_dir} vers {remote_dir}")

    # Se positionner dans le répertoire distant
    try:
        ftp.cwd(remote_dir)
    except ftplib.error_perm:
        try:
            ftp.mkd(remote_dir)
            ftp.cwd(remote_dir)
        except:
            print(f"❌ Impossible d'accéder à {remote_dir}")
            return

    local_path = Path(local_dir)
    files_uploaded = 0
    files_failed = 0

    for item in sorted(local_path.rglob('*')):
        if item.is_file():
            relative_path = item.relative_to(local_path)
            remote_file_path = str(relative_path).replace('\\', '/')

            # Créer les sous-répertoires si nécessaire
            remote_dir_path = os.path.dirname(remote_file_path)
            if remote_dir_path:
                create_remote_dirs(ftp, remote_dir, remote_dir_path)

            # Upload le fichier
            try:
                with open(item, 'rb') as f:
                    ftp.storbinary(f'STOR {remote_file_path}', f)
                print(f"  ✓ {relative_path}")
                files_uploaded += 1
            except Exception as e:
                print(f"  ✗ Erreur pour {relative_path}: {e}")
                files_failed += 1

    print(f"\n📊 Résumé: {files_uploaded} fichiers uploadés, {files_failed} erreurs")

def create_remote_dirs(ftp, base_dir, dir_path):
    """Crée les répertoires distants de manière récursive"""
    current_dir = ftp.pwd()

    try:
        ftp.cwd(base_dir)

        for directory in dir_path.split('/'):
            if directory:
                try:
                    ftp.cwd(directory)
                except ftplib.error_perm:
                    try:
                        ftp.mkd(directory)
                        ftp.cwd(directory)
                    except:
                        pass
    finally:
        try:
            ftp.cwd(current_dir)
        except:
            pass

def main():
    print("🚀 JobGuinee - Déploiement FTP Automatique")
    print("=" * 50)

    # Vérifier que le build existe
    if not os.path.exists('dist'):
        print("\n❌ Dossier 'dist' introuvable.")
        print("Lancez 'npm run build' d'abord.")
        sys.exit(1)

    # Charger les credentials
    host, username, password = load_env_vars()

    print(f"\n🌐 Connexion à {host}...")
    print(f"👤 Utilisateur: {username}")

    try:
        # Connexion FTP
        print("\n⏳ Connexion en cours...")
        ftp = ftplib.FTP(host, timeout=60)
        ftp.login(username, password)
        ftp.set_pasv(True)  # Mode passif
        print("✅ Connecté avec succès!")

        # Afficher le répertoire actuel
        print(f"📂 Répertoire actuel: {ftp.pwd()}")

        # Upload des fichiers
        upload_directory(ftp, 'dist', '/public_html')

        print("\n" + "=" * 50)
        print("✅ Déploiement terminé avec succès!")
        print("🌐 Votre site est maintenant en ligne!")
        print("=" * 50)

        ftp.quit()

    except ftplib.error_perm as e:
        print(f"\n❌ Erreur de permission: {e}")
        print("Vérifiez vos credentials FTP dans .env")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
