"""
Tests for AIService, the NVIDIA NIM backed narrative generator.

The client is stubbed rather than the HTTP layer, so the model-fallback chain and
the JSON handling in _complete / _generate_json are exercised for real.
"""

import json
from types import SimpleNamespace
from typing import Any, List, Optional

import pytest

from services.ai_service import AIService

PATIENT = {
    "age": 78,
    "sex": "M",
    "egfr": 28.0,
    "ast_alt": 65.0,
    "albumin": 3.4,
    "medication_name": "Warfarin",
    "index_drug_dose": 7.5,
    "cyp2c9": "Poor",
}
PREDICTION = {
    "risk_level": "Critical",
    "overall_adr_risk": 96.66,
    "predicted_adr_type": "Electrolyte Imbalance",
}


class StubClient:
    """
    Minimal stand-in for the OpenAI client.

    with_options() must be supported because AIService sets a per-attempt timeout
    through it; the real client returns a configured copy, and returning self is
    close enough here while still recording the timeout used.
    """

    def __init__(self, completions: "StubCompletions") -> None:
        self.chat = SimpleNamespace(completions=completions)
        self._completions = completions

    def with_options(self, **kwargs: Any) -> "StubClient":
        self._completions.timeouts_used.append(kwargs.get("timeout"))
        return self


class StubCompletions:
    """Records calls and replays scripted results, one per invocation."""

    def __init__(self, results: List[Any]) -> None:
        self.results = list(results)
        self.models_called: List[str] = []
        self.timeouts_used: List[Any] = []
        self.last_kwargs: Optional[dict] = None

    def create(self, model: str, **kwargs: Any) -> Any:
        self.models_called.append(model)
        self.last_kwargs = kwargs
        outcome = self.results.pop(0) if self.results else RuntimeError("no result scripted")
        if isinstance(outcome, Exception):
            raise outcome
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=outcome))]
        )


def make_service(results: List[Any], **kwargs: Any) -> AIService:
    service = AIService(api_key="fake-test-key", **kwargs)
    stub = StubCompletions(results)
    service.client = StubClient(stub)
    service._stub = stub  # type: ignore[attr-defined]
    return service


# ------------------------------------------------------------------ offline

def test_service_without_key_is_unavailable() -> None:
    service = AIService(api_key="")
    assert service.is_available() is False


def test_report_falls_back_when_no_key() -> None:
    service = AIService(api_key="")
    result = service.generate_clinical_report(PATIENT, PREDICTION, "Harold Wilson", "Dr Test")

    assert result["ai_generated"] is False
    assert result["model"] == "rule-based-fallback"
    assert len(result["report"]) > 50


def test_chat_falls_back_when_no_key() -> None:
    service = AIService(api_key="")
    reply = service.chat_response("What is the top risk?")
    assert "Offline Mode" in reply


def test_mitigation_falls_back_when_no_key() -> None:
    service = AIService(api_key="")
    result = service.generate_mitigation_strategies(PATIENT, PREDICTION)

    assert result["ai_generated"] is False
    # Critical risk pushes the urgent review to the front of the list.
    assert result["mitigation_strategies"][0]["priority"] == "Critical"


# ------------------------------------------------------------------ success

def test_report_uses_the_model_when_available() -> None:
    service = make_service(["## Report\n\nNarrative body."])
    result = service.generate_clinical_report(PATIENT, PREDICTION)

    assert result["ai_generated"] is True
    assert result["report"].startswith("## Report")
    assert result["model"] == service.model_name


def test_thinking_is_disabled_by_default() -> None:
    service = make_service(["ok"])
    service.chat_response("hello")

    body = service._stub.last_kwargs["extra_body"]  # type: ignore[attr-defined]
    assert body["chat_template_kwargs"]["enable_thinking"] is False


# ----------------------------------------------------------- model fallback

def test_falls_back_to_secondary_model_when_primary_fails() -> None:
    service = make_service(
        [RuntimeError("Service temporarily overloaded"), "Narrative from the backup model."],
        model_name="primary-model",
        fallback_model="secondary-model",
    )
    result = service.generate_clinical_report(PATIENT, PREDICTION)

    assert result["ai_generated"] is True
    assert result["model"] == "secondary-model"
    assert service._stub.models_called == ["primary-model", "secondary-model"]  # type: ignore[attr-defined]


def test_rule_based_fallback_when_every_model_fails() -> None:
    service = make_service(
        [RuntimeError("overloaded"), RuntimeError("also overloaded")],
        model_name="primary-model",
        fallback_model="secondary-model",
    )
    result = service.generate_clinical_report(PATIENT, PREDICTION)

    assert result["ai_generated"] is False
    assert result["model"] == "rule-based-fallback"


def test_empty_completion_is_treated_as_failure() -> None:
    service = make_service(["   ", "Real content."], model_name="a", fallback_model="b")
    result = service.generate_clinical_report(PATIENT, PREDICTION)

    assert result["ai_generated"] is True
    assert result["model"] == "b"


def test_secondary_model_is_skipped_when_disabled() -> None:
    service = make_service([RuntimeError("boom")], model_name="only", fallback_model="")
    result = service.generate_clinical_report(PATIENT, PREDICTION)

    assert result["ai_generated"] is False
    assert service._stub.models_called == ["only"]  # type: ignore[attr-defined]


# -------------------------------------------------------------------- JSON

def test_mitigation_parses_a_json_object_wrapper() -> None:
    payload = json.dumps(
        {
            "mitigation_strategies": [
                {"priority": "Critical", "action": "Hold warfarin", "rationale": "eGFR 28."},
                {"priority": "High", "action": "Check INR", "rationale": "CYP2C9 poor."},
            ]
        }
    )
    service = make_service([payload])
    result = service.generate_mitigation_strategies(PATIENT, PREDICTION)

    assert result["ai_generated"] is True
    assert len(result["mitigation_strategies"]) == 2
    assert result["mitigation_strategies"][0]["action"] == "Hold warfarin"


def test_json_mode_is_requested_for_structured_output() -> None:
    service = make_service([json.dumps({"mitigation_strategies": [{"action": "x"}]})])
    service.generate_mitigation_strategies(PATIENT, PREDICTION)

    assert service._stub.last_kwargs["response_format"] == {"type": "json_object"}  # type: ignore[attr-defined]


def test_markdown_fenced_json_is_still_parsed() -> None:
    fenced = '```json\n{"mitigation_strategies": [{"priority": "High", "action": "Monitor"}]}\n```'
    service = make_service([fenced])
    result = service.generate_mitigation_strategies(PATIENT, PREDICTION)

    assert result["ai_generated"] is True
    assert result["mitigation_strategies"][0]["action"] == "Monitor"


def test_unparseable_json_falls_back_to_rules() -> None:
    service = make_service(["not json at all {broken", "still not json"])
    result = service.generate_mitigation_strategies(PATIENT, PREDICTION)

    assert result["ai_generated"] is False


def test_organ_breakdown_keeps_required_keys() -> None:
    # The model answers with only one system; the rest must be backfilled.
    payload = json.dumps(
        {
            "renal_system": {
                "risk_score": 90,
                "status": "Critical",
                "findings": "eGFR 28.",
                "monitoring": "Weekly creatinine.",
            }
        }
    )
    service = make_service([payload])
    result = service.generate_detailed_analysis(PATIENT, PREDICTION)

    breakdown = result["organ_system_breakdown"]
    assert result["ai_generated"] is True
    assert breakdown["renal_system"]["risk_score"] == 90
    for required in ("renal_system", "hepatic_system", "hematologic_system"):
        assert required in breakdown
        assert "risk_score" in breakdown[required]


@pytest.mark.parametrize(
    "method,args",
    [
        ("generate_drug_insights", ([{"name": "Warfarin"}, {"name": "Aspirin"}],)),
        ("generate_medication_analysis", (PATIENT, PREDICTION)),
        ("analyze_drug_interactions", (["Warfarin", "Aspirin"],)),
    ],
)
def test_every_narrative_method_degrades_without_a_key(method: str, args: tuple) -> None:
    service = AIService(api_key="")
    result = getattr(service, method)(*args)

    assert result["ai_generated"] is False
    assert result is not None


def test_last_attempt_gets_the_longer_timeout() -> None:
    """An overloaded primary should fail fast; the final attempt gets room to generate."""
    service = make_service(
        [RuntimeError("overloaded"), "Narrative."],
        model_name="primary",
        fallback_model="secondary",
    )
    service.timeout = 30.0
    service.long_timeout = 120.0
    service.generate_clinical_report(PATIENT, PREDICTION)

    assert service._stub.timeouts_used == [30.0, 120.0]  # type: ignore[attr-defined]


def test_single_model_still_gets_the_long_timeout() -> None:
    service = make_service(["Narrative."], model_name="only", fallback_model="")
    service.long_timeout = 120.0
    service.generate_clinical_report(PATIENT, PREDICTION)

    assert service._stub.timeouts_used == [120.0]  # type: ignore[attr-defined]
