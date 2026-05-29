from tortoise import fields
from tortoise.models import Model
from datetime import datetime


class Referral(Model):
    id = fields.IntField(pk=True)
    referrer_id = fields.IntField(index=True)
    referred_id = fields.IntField(index=True, unique=True)

    reward_paid = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(default=datetime.utcnow)

    class Meta:
        table = "referrals"

    def __str__(self):
        return f"Referral: {self.referrer_id} -> {self.referred_id}"


class ReferrerReward(Model):
    id = fields.IntField(pk=True)
    user_id = fields.IntField(index=True)
    referral_id = fields.IntField()

    reward_type = fields.CharField(
        max_length=20,
        choices=[
            ("bonus_days", "Bonus Days"),
            ("discount", "Discount"),
        ],
    )
    amount = fields.IntField()
    is_claimed = fields.BooleanField(default=False)

    created_at = fields.DatetimeField(default=datetime.utcnow)
    claimed_at = fields.DatetimeField(null=True)

    class Meta:
        table = "referrer_rewards"

    def __str__(self):
        return f"Reward for user {self.user_id}: {self.reward_type}"
