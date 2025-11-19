"""add_office_id_to_doctors_simple

Revision ID: d902393a116e
Revises: 2a29c9f307a0
Create Date: 2025-10-19 19:12:11.503896

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd902393a116e'
down_revision: Union[str, Sequence[str], None] = '2a29c9f307a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add office_id column to doctors table
    op.add_column('doctors', sa.Column('office_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_doctors_office_id', 'doctors', 'offices', ['office_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    """Downgrade schema."""
    # Remove office_id column from doctors table
    op.drop_constraint('fk_doctors_office_id', 'doctors', type_='foreignkey')
    op.drop_column('doctors', 'office_id')
