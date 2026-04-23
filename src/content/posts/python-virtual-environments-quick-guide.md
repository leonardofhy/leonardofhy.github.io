---
title: "Quick Note: Setting Up Python Virtual Environments"
date: 2025-08-03T09:30:00+08:00
draft: false
tags: ["python", "virtual-environments", "development", "quick-tip"]
categories: ["Quick Tips"]
author: "胡皓雍 (Leonardo Foo Haw Yang)"
summary: "A quick reference guide for creating and managing Python virtual environments using venv, including common commands and best practices."
---

## Why Virtual Environments?

Virtual environments keep your Python projects isolated and prevent dependency conflicts. Each project gets its own Python installation and package directory.

## Quick Setup

### Create Virtual Environment

```bash
# Create new virtual environment
python -m venv myproject-env

# Activate (macOS/Linux)
source myproject-env/bin/activate

# Activate (Windows)
myproject-env\Scripts\activate
```

### Install Packages

```bash
# Install packages
pip install requests pandas numpy

# Save dependencies
pip freeze > requirements.txt

# Install from requirements
pip install -r requirements.txt
```

### Deactivate

```bash
# When done working
deactivate
```

## Best Practices

- **Name consistently**: Use `projectname-env` or `venv` 
- **Add to .gitignore**: Never commit virtual environments
- **Use requirements.txt**: Track dependencies explicitly
- **Separate environments**: One per project

## Common Commands

```bash
# List installed packages
pip list

# Show package info
pip show package-name

# Upgrade package
pip install --upgrade package-name

# Uninstall package
pip uninstall package-name
```

## Alternative: Using Poetry

```bash
# Install Poetry (one time)
curl -sSL https://install.python-poetry.org | python3 -

# Create new project
poetry new myproject
cd myproject

# Add dependencies
poetry add requests pandas

# Activate shell
poetry shell
```

That's it! Virtual environments made simple. Happy coding! 🐍
