"""Load a tool from the skill folder next to this tests folder."""

import importlib.util
import os

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load(folder, name):
    spec = importlib.util.spec_from_file_location("panel_" + name, os.path.join(SKILL, name + ".py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def example(folder, name):
    return os.path.join(SKILL, name)
