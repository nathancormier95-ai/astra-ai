import 'package:flutter_test/flutter_test.dart';

import 'package:omnimind_flutter/app.dart';

void main() {
  testWidgets('shows the OmniMind Flutter workspace shell', (tester) async {
    await tester.pumpWidget(const OmniMindApp());

    expect(find.text('OmniMind'), findsOneWidget);
    expect(find.text('Flutter Android workspace'), findsOneWidget);
  });
}
