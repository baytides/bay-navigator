#!/usr/bin/env python3
"""Add verification_date: 2025-12-17 to all programs"""

import yaml
from pathlib import Path

today = "2025-12-16"
data_dirs = [
    Path("_data/programs"),
    Path("_data/college-university")
]

total = 0
for data_dir in data_dirs:
    if not data_dir.exists():
        continue
    
    for yaml_file in data_dir.glob("*.yml"):
        print(f"\n📂 {yaml_file}")
        
        with open(yaml_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse YAML while preserving structure
        data = yaml.safe_load(content)
        
        if not data:
            continue
        
        # Handle both list format and dict format
        programs = data if isinstance(data, list) else data.get('programs', [])
        
        for program in programs:
            if isinstance(program, dict):
                program['verified_date'] = today
                print(f"  ✅ {program.get('name', 'Unknown')}")
                total += 1
        
        # Write back preserving structure
        with open(yaml_file, 'w', encoding='utf-8') as f:
            if isinstance(data, list):
                yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
            else:
                yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

print(f"\n✨ Updated {total} programs!")
