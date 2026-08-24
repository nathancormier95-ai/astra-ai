import 'package:flutter_test/flutter_test.dart';

import 'package:allinoneaiassistant/app.dart';

void main() {
  testWidgets('shows the OmniMind Flutter workspace shell', (tester) async {
    await tester.pumpWidget(const OmniMindApp());

    expect(find.text('OmniMind'), findsOneWidget);
    expect(find.text('Flutter Android workspace'), findsOneWidget);
  });
}
