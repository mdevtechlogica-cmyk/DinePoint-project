class SessionPlan {
  const SessionPlan({
    required this.name,
    required this.status,
    this.adsEnabled = true,
  });

  final String name;
  final String status;
  final bool adsEnabled;
}
