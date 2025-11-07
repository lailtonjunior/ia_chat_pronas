"""
Funções de validação
"""

import re
from typing import Tuple

def validate_email(email: str) -> Tuple[bool, str]:
    """
    Valida formato de email
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if re.match(pattern, email):
        return True, "Email válido"
    return False, "Email inválido"

def validate_cnpj(cnpj: str) -> Tuple[bool, str]:
    """
    Valida formato de CNPJ brasileiro
    """
    # Remover caracteres especiais
    cnpj = re.sub(r'\D', '', cnpj)
    
    if len(cnpj) != 14:
        return False, "CNPJ deve ter 14 dígitos"
    
    # Validação básica de CNPJ (simplificada)
    if cnpj == cnpj[0] * 14:
        return False, "CNPJ inválido"
    
    return True, "CNPJ válido"

def validate_project_title(title: str) -> Tuple[bool, str]:
    """
    Valida título do projeto
    """
    if len(title) < 5:
        return False, "Título deve ter pelo menos 5 caracteres"
    
    if len(title) > 500:
        return False, "Título não deve ultrapassar 500 caracteres"
    
    return True, "Título válido"

def validate_text_length(text: str, min_length: int = 10, max_length: int = 50000) -> Tuple[bool, str]:
    """
    Valida comprimento de texto
    """
    if len(text) < min_length:
        return False, f"Texto deve ter no mínimo {min_length} caracteres"
    
    if len(text) > max_length:
        return False, f"Texto não deve ultrapassar {max_length} caracteres"
    
    return True, "Comprimento válido"

def validate_budget_item(amount: float) -> Tuple[bool, str]:
    """
    Valida valor de item orçamentário
    """
    if amount < 0:
        return False, "Valor não pode ser negativo"
    
    if amount > 1000000:  # Máximo de 1 milhão
        return False, "Valor muito alto para item orçamentário"
    
    return True, "Valor válido"
